export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      riders: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          email: string;
          phone: string;
          delivery_company: string;
          employee_id: string;
          verification_status: "pending" | "verified" | "rejected" | "suspended";
          is_available: boolean;
          hero_points: number;
          rescue_streak: number;
          total_rescues: number;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["riders"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["riders"]["Insert"]
        >;
      };
      emergencies: {
        Row: {
          id: string;
          emergency_id: string;
          latitude: number;
          longitude: number;
          address: string | null;
          threat_description: string | null;
          status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
          severity_level: "low" | "medium" | "high" | "critical" | null;
          victim_contact: string | null;
          assigned_rider_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          emergency_id: string;
          latitude: number;
          longitude: number;
          address?: string | null;
          threat_description?: string | null;
          status?: "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
          severity_level?: "low" | "medium" | "high" | "critical" | null;
          victim_contact?: string | null;
          assigned_rider_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["emergencies"]["Insert"]>;
      };
      emergency_media: {
        Row: {
          id: string;
          emergency_id: string;
          media_type: "image" | "voice";
          url: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["emergency_media"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["emergency_media"]["Insert"]
        >;
      };
      emergency_assignments: {
        Row: {
          id: string;
          emergency_id: string;
          rider_id: string;
          status: "notified" | "accepted" | "rejected" | "completed";
          notified_at: string;
          accepted_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          emergency_id: string;
          rider_id: string;
          status?: "notified" | "accepted" | "rejected" | "completed";
          notified_at?: string;
          accepted_at?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["emergency_assignments"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          emergency_id: string;
          rider_id: string;
          rating: number;
          feedback: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["reviews"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["reviews"]["Insert"]
        >;
      };
      hero_points: {
        Row: {
          id: string;
          rider_id: string;
          points: number;
          reason: string;
          emergency_id: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["hero_points"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["hero_points"]["Insert"]
        >;
      };
      notifications: {
        Row: {
          id: string;
          rider_id: string;
          emergency_id: string;
          type: "new_emergency" | "assignment_accepted" | "mission_update";
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["notifications"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["notifications"]["Insert"]
        >;
      };
      admin_users: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["admin_users"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["admin_users"]["Insert"]
        >;
      };
      rider_milestones: {
        Row: {
          id: string;
          assignment_id: string;
          rider_id: string;
          latitude: number;
          longitude: number;
          timestamp: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["rider_milestones"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["rider_milestones"]["Insert"]
        >;
      };
      rescue_reviews: {
        Row: {
          id: string;
          emergency_id: string;
          rider_id: string;
          review_status: "pending" | "approved" | "rejected";
          admin_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["rescue_reviews"]["Row"],
          "id" | "created_at" | "admin_notes" | "reviewed_by" | "reviewed_at"
        > & {
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["rescue_reviews"]["Insert"]
        >;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// Convenience types
export type Rider = Database["public"]["Tables"]["riders"]["Row"];
export type Emergency = Database["public"]["Tables"]["emergencies"]["Row"];
export type EmergencyMedia = Database["public"]["Tables"]["emergency_media"]["Row"];
export type EmergencyAssignment = Database["public"]["Tables"]["emergency_assignments"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type HeroPoint = Database["public"]["Tables"]["hero_points"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type AdminUser = Database["public"]["Tables"]["admin_users"]["Row"];
export type RiderMilestone = Database["public"]["Tables"]["rider_milestones"]["Row"];
export type RescueReview = Database["public"]["Tables"]["rescue_reviews"]["Row"];
