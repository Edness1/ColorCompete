export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      contests: {
        Row: {
          contest_type: string
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          image_url: string | null
          start_date: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          contest_type?: string
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          image_url?: string | null
          start_date: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          contest_type?: string
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          image_url?: string | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      line_art_daily: {
        Row: {
          art_style: string | null
          bw_image_url: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          image_url: string
          keywords: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          art_style?: string | null
          bw_image_url?: string | null
          created_at?: string | null
          date: string
          description: string
          id?: string
          image_url: string
          keywords?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          art_style?: string | null
          bw_image_url?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          image_url?: string
          keywords?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_sessions: {
        Row: {
          amount: number | null
          completed_at: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          payment_type: string
          session_id: string
          status: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          payment_type: string
          session_id: string
          status: string
          user_id: string
        }
        Update: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          payment_type?: string
          session_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          age_group: string
          contest_type: string
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          public_url: string
          status: string
          updated_at: string | null
          user_id: string | null
          votes: number
        }
        Insert: {
          age_group: string
          contest_type: string
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          public_url: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
          votes?: number
        }
        Update: {
          age_group?: string
          contest_type?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          public_url?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
          votes?: number
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          month: number
          remaining_submissions: number
          tier: string
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: number
          remaining_submissions?: number
          tier?: string
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: number
          remaining_submissions?: number
          tier?: string
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string | null
          id: string
          submission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          submission_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_one_time_submission_credit: {
        Args: { user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
