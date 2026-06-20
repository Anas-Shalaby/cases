-- =============================================================================
-- Case Management Dashboard — Initial Schema
-- Run this in Supabase SQL Editor or via Supabase CLI migrations
-- =============================================================================

-- Enums
CREATE TYPE user_role AS ENUM ('coordinator', 'expert', 'assistant');
CREATE TYPE case_status AS ENUM ('open', 'delayed', 'closed');

-- -----------------------------------------------------------------------------
-- 1. Profiles Table (extends Supabase Auth)
-- -----------------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL DEFAULT '',
    role user_role NOT NULL DEFAULT 'coordinator',
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2. Cases Table
-- -----------------------------------------------------------------------------
CREATE TABLE cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_number TEXT NOT NULL UNIQUE,
    case_name TEXT NOT NULL,
    status case_status NOT NULL DEFAULT 'open',

    -- Important Dates
    assignment_date DATE,
    meeting_date DATE,
    initial_report_date DATE,
    final_report_date DATE,

    -- Milestones (completed dates — set via checklist on edit)
    case_received_at DATE,
    parties_invited_at DATE,
    experts_meeting_at DATE,
    defendant_documents_received_at DATE,
    plaintiff_documents_received_at DATE,
    initial_report_prepared_at DATE,
    final_report_prepared_at DATE,
    case_closed_at DATE,

    -- Plaintiff Data (المدعي)
    plaintiff_name TEXT NOT NULL,
    plaintiff_phone TEXT,
    plaintiff_email TEXT,

    -- Defendant Data (المدعي عليه)
    defendant_name TEXT NOT NULL,
    defendant_phone TEXT,
    defendant_email TEXT,

    -- Relations
    coordinator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    expert_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assistant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_case_name ON cases(case_name);
CREATE INDEX idx_cases_coordinator_id ON cases(coordinator_id);
CREATE INDEX idx_cases_expert_id ON cases(expert_id);
CREATE INDEX idx_cases_assistant_id ON cases(assistant_id);
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);

-- case_number يُدخله المستخدم يدوياً (UNIQUE + NOT NULL)

-- -----------------------------------------------------------------------------
-- Auto-create profile on user signup
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, onboarding_completed)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'coordinator'),
        COALESCE((NEW.raw_user_meta_data->>'onboarding_completed')::boolean, false)
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Helper: current user's role
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security — Profiles
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- Row Level Security — Cases
-- -----------------------------------------------------------------------------
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cases_select_assigned_or_coordinator"
    ON cases FOR SELECT
    TO authenticated
    USING (
        public.get_user_role() = 'coordinator'
        OR coordinator_id = auth.uid()
        OR expert_id = auth.uid()
        OR assistant_id = auth.uid()
    );

CREATE POLICY "cases_insert_coordinator"
    ON cases FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role() = 'coordinator'
    );

CREATE POLICY "cases_update_assigned_or_coordinator"
    ON cases FOR UPDATE
    TO authenticated
    USING (
        public.get_user_role() = 'coordinator'
        OR coordinator_id = auth.uid()
        OR expert_id = auth.uid()
        OR assistant_id = auth.uid()
    )
    WITH CHECK (
        public.get_user_role() = 'coordinator'
        OR coordinator_id = auth.uid()
        OR expert_id = auth.uid()
        OR assistant_id = auth.uid()
    );

CREATE POLICY "cases_delete_coordinator"
    ON cases FOR DELETE
    TO authenticated
    USING (
        public.get_user_role() = 'coordinator'
    );
