export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          accuracy: number | null
          address: string
          amount: number
          category_id: string
          coop_fee: number
          created_at: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string | null
          date: string
          demo_payment: boolean | null
          distance_km: number
          emergency: boolean
          id: string
          lat: number | null
          lng: number | null
          location_source: string
          materials: number
          paid_at: string | null
          payment: string
          payment_method: string | null
          platform_fee: number
          problem: string
          rating: number | null
          recurring: string
          review: string | null
          slot: string
          start_at: string
          status: string
          subservice: string
          timeline: Json
          txn: string | null
          updated_at: string
          worker_code: string
          worker_user_id: string | null
        }
        Insert: {
          accuracy?: number | null
          address?: string
          amount?: number
          category_id?: string
          coop_fee?: number
          created_at?: string
          customer_email?: string
          customer_id: string
          customer_name?: string
          customer_phone?: string | null
          date: string
          demo_payment?: boolean | null
          distance_km?: number
          emergency?: boolean
          id: string
          lat?: number | null
          lng?: number | null
          location_source?: string
          materials?: number
          paid_at?: string | null
          payment?: string
          payment_method?: string | null
          platform_fee?: number
          problem?: string
          rating?: number | null
          recurring?: string
          review?: string | null
          slot?: string
          start_at?: string
          status?: string
          subservice?: string
          timeline?: Json
          txn?: string | null
          updated_at?: string
          worker_code: string
          worker_user_id?: string | null
        }
        Update: {
          accuracy?: number | null
          address?: string
          amount?: number
          category_id?: string
          coop_fee?: number
          created_at?: string
          customer_email?: string
          customer_id?: string
          customer_name?: string
          customer_phone?: string | null
          date?: string
          demo_payment?: boolean | null
          distance_km?: number
          emergency?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          location_source?: string
          materials?: number
          paid_at?: string | null
          payment?: string
          payment_method?: string | null
          platform_fee?: number
          problem?: string
          rating?: number | null
          recurring?: string
          review?: string | null
          slot?: string
          start_at?: string
          status?: string
          subservice?: string
          timeline?: Json
          txn?: string | null
          updated_at?: string
          worker_code?: string
          worker_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_worker_code_fkey"
            columns: ["worker_code"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["worker_code"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string
          created_at: string
          from_role: string
          id: string
          sender_id: string
          text: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          from_role: string
          id?: string
          sender_id: string
          text: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          from_role?: string
          id?: string
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: string
          body: string
          booking_id: string | null
          created_at: string
          dedupe_key: string
          id: string
          read: boolean
          tag: string
          target: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          audience: string
          body?: string
          booking_id?: string | null
          created_at?: string
          dedupe_key: string
          id?: string
          read?: boolean
          tag?: string
          target?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          audience?: string
          body?: string
          booking_id?: string | null
          created_at?: string
          dedupe_key?: string
          id?: string
          read?: boolean
          tag?: string
          target?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          is_test: boolean
          method: string | null
          status: string
          txn: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          booking_id: string
          created_at?: string
          id?: string
          is_test?: boolean
          method?: string | null
          status?: string
          txn?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          is_test?: boolean
          method?: string | null
          status?: string
          txn?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          district: string | null
          email: string
          full_name: string
          id: string
          is_demo: boolean
          landmark: string | null
          language: string
          lat: number | null
          lng: number | null
          mandal: string | null
          phone: string | null
          pincode: string | null
          rejection_reason: string | null
          role: string
          state: string | null
          status: string
          updated_at: string
          village: string | null
        }
        Insert: {
          created_at?: string
          district?: string | null
          email: string
          full_name?: string
          id: string
          is_demo?: boolean
          landmark?: string | null
          language?: string
          lat?: number | null
          lng?: number | null
          mandal?: string | null
          phone?: string | null
          pincode?: string | null
          rejection_reason?: string | null
          role?: string
          state?: string | null
          status?: string
          updated_at?: string
          village?: string | null
        }
        Update: {
          created_at?: string
          district?: string | null
          email?: string
          full_name?: string
          id?: string
          is_demo?: boolean
          landmark?: string | null
          language?: string
          lat?: number | null
          lng?: number | null
          mandal?: string | null
          phone?: string | null
          pincode?: string | null
          rejection_reason?: string | null
          role?: string
          state?: string | null
          status?: string
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string
          created_at: string
          customer_id: string
          customer_name: string
          id: string
          stars: number
          worker_code: string
        }
        Insert: {
          booking_id: string
          comment?: string
          created_at?: string
          customer_id: string
          customer_name?: string
          id?: string
          stars: number
          worker_code: string
        }
        Update: {
          booking_id?: string
          comment?: string
          created_at?: string
          customer_id?: string
          customer_name?: string
          id?: string
          stars?: number
          worker_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      worker_profiles: {
        Row: {
          area: string
          availability_days: string
          availability_time: string
          available_now: boolean
          category_id: string
          certificates: string
          completion_rate: number
          created_at: string
          experience: number
          hourly: number
          id: string
          insurance: string
          is_demo: boolean
          jobs: number
          kyc: string
          languages: string[]
          lat: number | null
          lng: number | null
          membership_id: string
          name: string
          payout: string
          radius_km: number
          rating: number
          skills: string[]
          society: string
          status: string
          updated_at: string
          user_id: string | null
          verified: Json
          worker_code: string
        }
        Insert: {
          area?: string
          availability_days?: string
          availability_time?: string
          available_now?: boolean
          category_id?: string
          certificates?: string
          completion_rate?: number
          created_at?: string
          experience?: number
          hourly?: number
          id?: string
          insurance?: string
          is_demo?: boolean
          jobs?: number
          kyc?: string
          languages?: string[]
          lat?: number | null
          lng?: number | null
          membership_id?: string
          name?: string
          payout?: string
          radius_km?: number
          rating?: number
          skills?: string[]
          society?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          verified?: Json
          worker_code: string
        }
        Update: {
          area?: string
          availability_days?: string
          availability_time?: string
          available_now?: boolean
          category_id?: string
          certificates?: string
          completion_rate?: number
          created_at?: string
          experience?: number
          hourly?: number
          id?: string
          insurance?: string
          is_demo?: boolean
          jobs?: number
          kyc?: string
          languages?: string[]
          lat?: number | null
          lng?: number | null
          membership_id?: string
          name?: string
          payout?: string
          radius_km?: number
          rating?: number
          skills?: string[]
          society?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          verified?: Json
          worker_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_booking_member: { Args: { _booking_id: string }; Returns: boolean }
      push_notification: {
        Args: {
          _audience: string
          _body: string
          _booking_id: string
          _dedupe: string
          _tag: string
          _target: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "worker" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "worker", "admin"],
    },
  },
} as const
