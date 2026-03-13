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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assignment_submissions: {
        Row: {
          assignment_id: string
          feedback_ar: string | null
          feedback_en: string | null
          file_name: string | null
          file_url: string
          grade: string | null
          graded_at: string | null
          id: string
          student_id: string
          submitted_at: string
        }
        Insert: {
          assignment_id: string
          feedback_ar?: string | null
          feedback_en?: string | null
          file_name?: string | null
          file_url: string
          grade?: string | null
          graded_at?: string | null
          id?: string
          student_id: string
          submitted_at?: string
        }
        Update: {
          assignment_id?: string
          feedback_ar?: string | null
          feedback_en?: string | null
          file_name?: string | null
          file_url?: string
          grade?: string | null
          graded_at?: string | null
          id?: string
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          course_id: string
          created_at: string
          creator_id: string
          description_ar: string | null
          description_en: string | null
          due_date: string | null
          file_name: string | null
          file_url: string | null
          id: string
          title_ar: string
          title_en: string
        }
        Insert: {
          course_id: string
          created_at?: string
          creator_id: string
          description_ar?: string | null
          description_en?: string | null
          due_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          title_ar: string
          title_en: string
        }
        Update: {
          course_id?: string
          created_at?: string
          creator_id?: string
          description_ar?: string | null
          description_en?: string | null
          due_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          title_ar?: string
          title_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      book_orders: {
        Row: {
          amount: number
          book_id: string
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          book_id: string
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          book_id?: string
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_orders_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author_ar: string
          author_en: string
          category: string
          cover_url: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          format: string | null
          id: string
          is_active: boolean | null
          is_bestseller: boolean | null
          is_new: boolean | null
          original_price: number | null
          pages: number | null
          price: number
          rating: number | null
          reviews_count: number | null
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          author_ar: string
          author_en: string
          category?: string
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          format?: string | null
          id?: string
          is_active?: boolean | null
          is_bestseller?: boolean | null
          is_new?: boolean | null
          original_price?: number | null
          pages?: number | null
          price: number
          rating?: number | null
          reviews_count?: number | null
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          author_ar?: string
          author_en?: string
          category?: string
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          format?: string | null
          id?: string
          is_active?: boolean | null
          is_bestseller?: boolean | null
          is_new?: boolean | null
          original_price?: number | null
          pages?: number | null
          price?: number
          rating?: number | null
          reviews_count?: number | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_attachments: {
        Row: {
          course_id: string
          created_at: string
          file_type: string | null
          file_url: string
          id: string
          name: string
        }
        Insert: {
          course_id: string
          created_at?: string
          file_type?: string | null
          file_url: string
          id?: string
          name: string
        }
        Update: {
          course_id?: string
          created_at?: string
          file_type?: string | null
          file_url?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_attachments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_episodes: {
        Row: {
          course_id: string
          created_at: string
          duration_minutes: number | null
          episode_number: number
          id: string
          is_preview: boolean
          title_ar: string
          title_en: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          duration_minutes?: number | null
          episode_number?: number
          id?: string
          is_preview?: boolean
          title_ar: string
          title_en: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          duration_minutes?: number | null
          episode_number?: number
          id?: string
          is_preview?: boolean
          title_ar?: string
          title_en?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_episodes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_views: {
        Row: {
          course_id: string
          id: string
          viewed_at: string
        }
        Insert: {
          course_id: string
          id?: string
          viewed_at?: string
        }
        Update: {
          course_id?: string
          id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_views_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category_ar: string
          category_en: string
          created_at: string
          creator_id: string | null
          episode_count: number
          id: string
          instructor_ar: string
          instructor_en: string
          is_free: boolean
          thumbnail_url: string | null
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          category_ar: string
          category_en: string
          created_at?: string
          creator_id?: string | null
          episode_count?: number
          id?: string
          instructor_ar: string
          instructor_en: string
          is_free?: boolean
          thumbnail_url?: string | null
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          category_ar?: string
          category_en?: string
          created_at?: string
          creator_id?: string | null
          episode_count?: number
          id?: string
          instructor_ar?: string
          instructor_en?: string
          is_free?: boolean
          thumbnail_url?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_streams: {
        Row: {
          course_id: string | null
          created_at: string
          creator_id: string
          id: string
          scheduled_at: string | null
          status: string
          stream_url: string | null
          title_ar: string
          title_en: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          creator_id: string
          id?: string
          scheduled_at?: string | null
          status?: string
          stream_url?: string | null
          title_ar: string
          title_en: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          scheduled_at?: string | null
          status?: string
          stream_url?: string | null
          title_ar?: string
          title_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          additional_certs_urls: string[] | null
          created_at: string
          email: string
          full_name: string
          id: string
          id_photo_url: string | null
          live_photo_url: string | null
          phone: string
          role: string
          university_cert_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_certs_urls?: string[] | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          id_photo_url?: string | null
          live_photo_url?: string | null
          phone: string
          role: string
          university_cert_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_certs_urls?: string[] | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          id_photo_url?: string | null
          live_photo_url?: string | null
          phone?: string
          role?: string
          university_cert_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_top_courses: {
        Row: {
          calculated_at: string
          course_id: string
          id: string
          view_count: number
          week_start: string
        }
        Insert: {
          calculated_at?: string
          course_id: string
          id?: string
          view_count?: number
          week_start: string
        }
        Update: {
          calculated_at?: string
          course_id?: string
          id?: string
          view_count?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_top_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_weekly_top_courses: { Args: never; Returns: undefined }
      get_profile_count: { Args: never; Returns: number }
      get_profile_count_by_role: { Args: { _role: string }; Returns: number }
      has_approved_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "lecturer" | "student"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "lecturer", "student"],
    },
  },
} as const
