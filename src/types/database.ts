export type UserRole = "coordinator" | "expert" | "assistant";
export type CaseStatus = "open" | "delayed" | "closed";
export type CasePartyType = "plaintiff" | "defendant";
export type NotificationType =
  | "report_deadline"
  | "meeting_reminder"
  | "new_document"
  | "case_assigned";

export type LogActionType =
  | "create_case"
  | "update_case"
  | "delete_case"
  | "create_user"
  | "update_user"
  | "delete_user"
  | "upload_document";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  onboarding_completed: boolean;
  created_at: string;
}

export interface CaseParty {
  id: string;
  case_id: string;
  party_type: CasePartyType;
  name: string;
  phone: string | null;
  email: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  agent_email: string | null;
  sort_order: number;
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
  coordinator_id: string | null;
  expert_id: string | null;
  assistant_id: string | null;
  created_at: string;
}

export interface CaseWithRelations extends Case {
  parties: CaseParty[];
  coordinator: Pick<Profile, "id" | "full_name"> | null;
  expert: Pick<Profile, "id" | "full_name"> | null;
  assistant: Pick<Profile, "id" | "full_name"> | null;
}

export interface CaseDocument {
  id: string;
  case_id: string;
  title: string;
  file_path: string | null;
  uploaded_by: string | null;
  created_at: string;
  uploader?: Pick<Profile, "id" | "full_name"> | null;
}

export interface Notification {
  id: string;
  user_id: string;
  case_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationWithCase extends Notification {
  case: Pick<Case, "id" | "case_number" | "case_name"> | null;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action_type: LogActionType;
  case_id: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ActivityLogWithRelations extends ActivityLog {
  actor: Pick<Profile, "id" | "full_name"> | null;
  case: Pick<Case, "id" | "case_number" | "case_name"> | null;
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
          coordinator_id?: string | null;
          expert_id?: string | null;
          assistant_id?: string | null;
        };
        Relationships: [];
      };
      case_parties: {
        Row: CaseParty;
        Insert: {
          id?: string;
          case_id: string;
          party_type: CasePartyType;
          name: string;
          phone?: string | null;
          email?: string | null;
          agent_name?: string | null;
          agent_phone?: string | null;
          agent_email?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          party_type?: CasePartyType;
          name?: string;
          phone?: string | null;
          email?: string | null;
          agent_name?: string | null;
          agent_phone?: string | null;
          agent_email?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      case_documents: {
        Row: CaseDocument;
        Insert: {
          id?: string;
          case_id: string;
          title: string;
          file_path?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          file_path?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: {
          id?: string;
          user_id: string;
          case_id: string;
          type: NotificationType;
          title: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: {
          id?: string;
          user_id?: string | null;
          action_type: LogActionType;
          case_id?: string | null;
          description: string;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          description?: string;
          metadata?: Record<string, unknown> | null;
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
      sync_deadline_notifications: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      user_role: UserRole;
      case_status: CaseStatus;
      case_party_type: CasePartyType;
      notification_type: NotificationType;
      log_action_type: LogActionType;
    };
    CompositeTypes: Record<string, never>;
  };
}
