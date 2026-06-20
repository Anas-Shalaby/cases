export type UserRole = "coordinator" | "expert" | "assistant";
export type CaseStatus = "open" | "delayed" | "closed";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  onboarding_completed: boolean;
  created_at: string;
}

export interface Case {
  id: string;
  case_number: string;
  case_name: string;
  status: CaseStatus;
  assignment_date: string | null;
  meeting_date: string | null;
  initial_report_date: string | null;
  final_report_date: string | null;
  case_received_at: string | null;
  parties_invited_at: string | null;
  experts_meeting_at: string | null;
  defendant_documents_received_at: string | null;
  plaintiff_documents_received_at: string | null;
  initial_report_prepared_at: string | null;
  final_report_prepared_at: string | null;
  case_closed_at: string | null;
  plaintiff_name: string;
  plaintiff_phone: string | null;
  plaintiff_email: string | null;
  defendant_name: string;
  defendant_phone: string | null;
  defendant_email: string | null;
  coordinator_id: string | null;
  expert_id: string | null;
  assistant_id: string | null;
  created_at: string;
}

export interface CaseWithRelations extends Case {
  coordinator: Pick<Profile, "id" | "full_name"> | null;
  expert: Pick<Profile, "id" | "full_name"> | null;
  assistant: Pick<Profile, "id" | "full_name"> | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name?: string;
          role?: UserRole;
          onboarding_completed?: boolean;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          role?: UserRole;
          onboarding_completed?: boolean;
        };
        Relationships: [];
      };
      cases: {
        Row: Case;
        Insert: {
          id?: string;
          case_number: string;
          case_name: string;
          status?: CaseStatus;
          assignment_date?: string | null;
          meeting_date?: string | null;
          initial_report_date?: string | null;
          final_report_date?: string | null;
          case_received_at?: string | null;
          parties_invited_at?: string | null;
          experts_meeting_at?: string | null;
          defendant_documents_received_at?: string | null;
          plaintiff_documents_received_at?: string | null;
          initial_report_prepared_at?: string | null;
          final_report_prepared_at?: string | null;
          case_closed_at?: string | null;
          plaintiff_name: string;
          plaintiff_phone?: string | null;
          plaintiff_email?: string | null;
          defendant_name: string;
          defendant_phone?: string | null;
          defendant_email?: string | null;
          coordinator_id?: string | null;
          expert_id?: string | null;
          assistant_id?: string | null;
          created_at?: string;
        };
        Update: {
          case_number?: string;
          case_name?: string;
          status?: CaseStatus;
          assignment_date?: string | null;
          meeting_date?: string | null;
          initial_report_date?: string | null;
          final_report_date?: string | null;
          case_received_at?: string | null;
          parties_invited_at?: string | null;
          experts_meeting_at?: string | null;
          defendant_documents_received_at?: string | null;
          plaintiff_documents_received_at?: string | null;
          initial_report_prepared_at?: string | null;
          final_report_prepared_at?: string | null;
          case_closed_at?: string | null;
          plaintiff_name?: string;
          plaintiff_phone?: string | null;
          plaintiff_email?: string | null;
          defendant_name?: string;
          defendant_phone?: string | null;
          defendant_email?: string | null;
          coordinator_id?: string | null;
          expert_id?: string | null;
          assistant_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      user_role: UserRole;
      case_status: CaseStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
