-- Add onboarding flag to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Mark existing users as already onboarded
UPDATE profiles SET onboarding_completed = true WHERE onboarding_completed = false;

-- Update signup trigger for new users
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
