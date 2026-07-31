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
      _cleanup_audit_snapshot: {
        Row: {
          approved: boolean | null
          auth_user_id: string | null
          email: string | null
          evidence: string | null
          has_profile: boolean | null
          has_role_row: boolean | null
          role_name: string | null
          snapshot_at: string | null
          snapshot_by: unknown
        }
        Insert: {
          approved?: boolean | null
          auth_user_id?: string | null
          email?: string | null
          evidence?: string | null
          has_profile?: boolean | null
          has_role_row?: boolean | null
          role_name?: string | null
          snapshot_at?: string | null
          snapshot_by?: unknown
        }
        Update: {
          approved?: boolean | null
          auth_user_id?: string | null
          email?: string | null
          evidence?: string | null
          has_profile?: boolean | null
          has_role_row?: boolean | null
          role_name?: string | null
          snapshot_at?: string | null
          snapshot_by?: unknown
        }
        Relationships: []
      }
      active_sessions: {
        Row: {
          created_at: string
          device_id: string
          id: string
          last_seen: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          last_seen?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          last_seen?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
          department_id: string | null
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
          department_id?: string | null
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
          department_id?: string | null
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
          {
            foreignKeyName: "assignments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
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
      college_invitations: {
        Row: {
          college_id: string
          created_at: string
          expires_at: string | null
          id: string
          invitation_code: string
          is_active: boolean | null
          max_uses: number | null
          role: string
          used_count: number | null
        }
        Insert: {
          college_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          invitation_code?: string
          is_active?: boolean | null
          max_uses?: number | null
          role?: string
          used_count?: number | null
        }
        Update: {
          college_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          invitation_code?: string
          is_active?: boolean | null
          max_uses?: number | null
          role?: string
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "college_invitations_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "approved_colleges_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "college_invitations_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "college_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      college_members: {
        Row: {
          college_id: string
          id: string
          invitation_id: string | null
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          college_id: string
          id?: string
          invitation_id?: string | null
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          college_id?: string
          id?: string
          invitation_id?: string | null
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "college_members_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "approved_colleges_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "college_members_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "college_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "college_members_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "college_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      college_registrations: {
        Row: {
          address: string | null
          city: string
          college_name: string
          created_at: string
          dean_name: string
          email: string
          email_confirmed: boolean
          id: string
          logo_url: string | null
          message: string | null
          phone: string
          status: string
          student_count: number | null
          type: string
          university_name: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city: string
          college_name: string
          created_at?: string
          dean_name: string
          email: string
          email_confirmed?: boolean
          id?: string
          logo_url?: string | null
          message?: string | null
          phone: string
          status?: string
          student_count?: number | null
          type?: string
          university_name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string
          college_name?: string
          created_at?: string
          dean_name?: string
          email?: string
          email_confirmed?: boolean
          id?: string
          logo_url?: string | null
          message?: string | null
          phone?: string
          status?: string
          student_count?: number | null
          type?: string
          university_name?: string | null
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
          level_number: number
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
          level_number?: number
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
          level_number?: number
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
      course_levels: {
        Row: {
          course_id: string
          created_at: string
          description_ar: string | null
          description_en: string | null
          episode_count: number
          id: string
          is_unlimited: boolean
          level_number: number
          price: number
          title_ar: string
          title_en: string
          updated_at: string
          yearly_discount_percent: number
        }
        Insert: {
          course_id: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          episode_count?: number
          id?: string
          is_unlimited?: boolean
          level_number?: number
          price?: number
          title_ar: string
          title_en: string
          updated_at?: string
          yearly_discount_percent?: number
        }
        Update: {
          course_id?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          episode_count?: number
          id?: string
          is_unlimited?: boolean
          level_number?: number
          price?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
          yearly_discount_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_levels_course_id_fkey"
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
          department_id: string | null
          episode_count: number
          expires_at: string | null
          id: string
          instructor_ar: string
          instructor_en: string
          is_free: boolean
          price: number
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
          department_id?: string | null
          episode_count?: number
          expires_at?: string | null
          id?: string
          instructor_ar: string
          instructor_en: string
          is_free?: boolean
          price?: number
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
          department_id?: string | null
          episode_count?: number
          expires_at?: string | null
          id?: string
          instructor_ar?: string
          instructor_en?: string
          is_free?: boolean
          price?: number
          thumbnail_url?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      department_members: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          department_id: string
          email: string | null
          full_name: string
          gender: string | null
          hire_date: string | null
          id: string
          invitation_code: string | null
          national_id: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          qualification: string | null
          role: string
          specialization: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          department_id: string
          email?: string | null
          full_name: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          invitation_code?: string | null
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          role?: string
          specialization?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string
          email?: string | null
          full_name?: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          invitation_code?: string | null
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          role?: string
          specialization?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "department_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          department_code: string | null
          department_name: string
          id: string
          institution_id: string
          institution_type: string
          lecturer_count: number
          payment_amount: number
          payment_status: string
          status: string
          student_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_code?: string | null
          department_name: string
          id?: string
          institution_id: string
          institution_type?: string
          lecturer_count?: number
          payment_amount?: number
          payment_status?: string
          status?: string
          student_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_code?: string | null
          department_name?: string
          id?: string
          institution_id?: string
          institution_type?: string
          lecturer_count?: number
          payment_amount?: number
          payment_status?: string
          status?: string
          student_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      faculty_edit_audit: {
        Row: {
          changes: Json
          created_at: string
          edited_by: string
          edited_by_email: string | null
          id: string
          institution_id: string | null
          institution_type: string | null
          member_department_member_id: string | null
          member_user_id: string
        }
        Insert: {
          changes?: Json
          created_at?: string
          edited_by: string
          edited_by_email?: string | null
          id?: string
          institution_id?: string | null
          institution_type?: string | null
          member_department_member_id?: string | null
          member_user_id: string
        }
        Update: {
          changes?: Json
          created_at?: string
          edited_by?: string
          edited_by_email?: string | null
          id?: string
          institution_id?: string | null
          institution_type?: string | null
          member_department_member_id?: string | null
          member_user_id?: string
        }
        Relationships: []
      }
      institute_invitations: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          institute_id: string
          invitation_code: string
          is_active: boolean | null
          max_uses: number | null
          role: string
          used_count: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          institute_id: string
          invitation_code?: string
          is_active?: boolean | null
          max_uses?: number | null
          role?: string
          used_count?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          institute_id?: string
          invitation_code?: string
          is_active?: boolean | null
          max_uses?: number | null
          role?: string
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "institute_invitations_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "approved_institutes_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institute_invitations_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "institute_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      institute_registrations: {
        Row: {
          address: string | null
          city: string
          created_at: string
          director_name: string
          email: string
          email_confirmed: boolean
          id: string
          institute_name: string
          logo_url: string | null
          message: string | null
          phone: string
          specialization: string | null
          status: string
          student_count: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city: string
          created_at?: string
          director_name: string
          email: string
          email_confirmed?: boolean
          id?: string
          institute_name: string
          logo_url?: string | null
          message?: string | null
          phone: string
          specialization?: string | null
          status?: string
          student_count?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string
          created_at?: string
          director_name?: string
          email?: string
          email_confirmed?: boolean
          id?: string
          institute_name?: string
          logo_url?: string | null
          message?: string | null
          phone?: string
          specialization?: string | null
          status?: string
          student_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      institution_faculty_members: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          department_id: string | null
          email: string | null
          full_name: string
          gender: string | null
          hire_date: string | null
          id: string
          institution_id: string
          institution_type: string
          national_id: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          qualification: string | null
          specialization: string | null
          specific_role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          institution_id: string
          institution_type: string
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          specialization?: string | null
          specific_role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          institution_id?: string
          institution_type?: string
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          specialization?: string | null
          specific_role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_faculty_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          option_a_ar: string
          option_a_en: string
          option_b_ar: string
          option_b_en: string
          option_c_ar: string
          option_c_en: string
          option_d_ar: string
          option_d_en: string
          points: number
          question_ar: string
          question_en: string
          question_order: number
          quiz_id: string
        }
        Insert: {
          correct_answer?: string
          created_at?: string
          id?: string
          option_a_ar?: string
          option_a_en?: string
          option_b_ar?: string
          option_b_en?: string
          option_c_ar?: string
          option_c_en?: string
          option_d_ar?: string
          option_d_en?: string
          points?: number
          question_ar: string
          question_en: string
          question_order?: number
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          option_a_ar?: string
          option_a_en?: string
          option_b_ar?: string
          option_b_en?: string
          option_c_ar?: string
          option_c_en?: string
          option_d_ar?: string
          option_d_en?: string
          points?: number
          question_ar?: string
          question_en?: string
          question_order?: number
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "institution_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_quizzes: {
        Row: {
          created_at: string
          created_by: string
          department_name: string | null
          description_ar: string | null
          description_en: string | null
          due_date: string | null
          duration_minutes: number | null
          id: string
          institution_id: string
          institution_type: string
          is_published: boolean | null
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          department_name?: string | null
          description_ar?: string | null
          description_en?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          id?: string
          institution_id: string
          institution_type?: string
          is_published?: boolean | null
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          department_name?: string | null
          description_ar?: string | null
          description_en?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          id?: string
          institution_id?: string
          institution_type?: string
          is_published?: boolean | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      invitation_rate_limits: {
        Row: {
          action_type: string
          attempted_at: string
          ip_hash: string
          user_id: string | null
        }
        Insert: {
          action_type?: string
          attempted_at?: string
          ip_hash?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          attempted_at?: string
          ip_hash?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lecture_ratings: {
        Row: {
          comment: string | null
          course_id: string | null
          created_at: string
          id: string
          lecture_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          lecture_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          lecture_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      lecture_schedules: {
        Row: {
          approved_by_dean: boolean
          approved_by_dean_at: string | null
          approved_by_dean_id: string | null
          approved_by_head: boolean
          approved_by_head_at: string | null
          approved_by_head_id: string | null
          approved_by_vice_dean: boolean
          approved_by_vice_dean_at: string | null
          approved_by_vice_dean_id: string | null
          course_id: string
          created_at: string
          creator_id: string
          department_id: string | null
          end_time: string | null
          id: string
          location_ar: string | null
          location_en: string | null
          notes_ar: string | null
          notes_en: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          schedule_type: string
          scheduled_date: string
          start_time: string | null
          title_ar: string
          title_en: string
          vice_dean_type: string[] | null
        }
        Insert: {
          approved_by_dean?: boolean
          approved_by_dean_at?: string | null
          approved_by_dean_id?: string | null
          approved_by_head?: boolean
          approved_by_head_at?: string | null
          approved_by_head_id?: string | null
          approved_by_vice_dean?: boolean
          approved_by_vice_dean_at?: string | null
          approved_by_vice_dean_id?: string | null
          course_id: string
          created_at?: string
          creator_id: string
          department_id?: string | null
          end_time?: string | null
          id?: string
          location_ar?: string | null
          location_en?: string | null
          notes_ar?: string | null
          notes_en?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          schedule_type?: string
          scheduled_date: string
          start_time?: string | null
          title_ar: string
          title_en: string
          vice_dean_type?: string[] | null
        }
        Update: {
          approved_by_dean?: boolean
          approved_by_dean_at?: string | null
          approved_by_dean_id?: string | null
          approved_by_head?: boolean
          approved_by_head_at?: string | null
          approved_by_head_id?: string | null
          approved_by_vice_dean?: boolean
          approved_by_vice_dean_at?: string | null
          approved_by_vice_dean_id?: string | null
          course_id?: string
          created_at?: string
          creator_id?: string
          department_id?: string | null
          end_time?: string | null
          id?: string
          location_ar?: string | null
          location_en?: string | null
          notes_ar?: string | null
          notes_en?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          schedule_type?: string
          scheduled_date?: string
          start_time?: string | null
          title_ar?: string
          title_en?: string
          vice_dean_type?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "lecture_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecture_schedules_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      lecturer_ratings: {
        Row: {
          comment: string | null
          course_id: string
          created_at: string
          id: string
          lecturer_id: string
          rating: number
          student_id: string
        }
        Insert: {
          comment?: string | null
          course_id: string
          created_at?: string
          id?: string
          lecturer_id: string
          rating: number
          student_id: string
        }
        Update: {
          comment?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lecturer_id?: string
          rating?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecturer_ratings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      live_stream_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          stream_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          stream_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_ratings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          category_ar: string | null
          category_en: string | null
          course_id: string | null
          created_at: string
          creator_id: string
          department_id: string | null
          expires_at: string | null
          id: string
          instructor_ar: string | null
          instructor_en: string | null
          scheduled_at: string | null
          status: string
          stream_url: string | null
          title_ar: string
          title_en: string
        }
        Insert: {
          category_ar?: string | null
          category_en?: string | null
          course_id?: string | null
          created_at?: string
          creator_id: string
          department_id?: string | null
          expires_at?: string | null
          id?: string
          instructor_ar?: string | null
          instructor_en?: string | null
          scheduled_at?: string | null
          status?: string
          stream_url?: string | null
          title_ar: string
          title_en: string
        }
        Update: {
          category_ar?: string | null
          category_en?: string | null
          course_id?: string | null
          created_at?: string
          creator_id?: string
          department_id?: string | null
          expires_at?: string | null
          id?: string
          instructor_ar?: string | null
          instructor_en?: string | null
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
          {
            foreignKeyName: "live_streams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_documents: {
        Row: {
          additional_certs_urls: string[] | null
          created_at: string
          id_photo_url: string | null
          live_photo_url: string | null
          university_cert_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_certs_urls?: string[] | null
          created_at?: string
          id_photo_url?: string | null
          live_photo_url?: string | null
          university_cert_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_certs_urls?: string[] | null
          created_at?: string
          id_photo_url?: string | null
          live_photo_url?: string | null
          university_cert_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          must_change_password: boolean
          phone: string | null
          platform: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          must_change_password?: boolean
          phone?: string | null
          platform?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          must_change_password?: boolean
          phone?: string | null
          platform?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          expected_answer: string | null
          id: string
          image_url: string | null
          option_a_ar: string | null
          option_a_en: string | null
          option_b_ar: string | null
          option_b_en: string | null
          option_c_ar: string | null
          option_c_en: string | null
          option_d_ar: string | null
          option_d_en: string | null
          points: number
          question_ar: string
          question_en: string
          question_order: number
          question_type: string
          quiz_id: string
        }
        Insert: {
          correct_answer?: string
          created_at?: string
          expected_answer?: string | null
          id?: string
          image_url?: string | null
          option_a_ar?: string | null
          option_a_en?: string | null
          option_b_ar?: string | null
          option_b_en?: string | null
          option_c_ar?: string | null
          option_c_en?: string | null
          option_d_ar?: string | null
          option_d_en?: string | null
          points?: number
          question_ar: string
          question_en: string
          question_order?: number
          question_type?: string
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          expected_answer?: string | null
          id?: string
          image_url?: string | null
          option_a_ar?: string | null
          option_a_en?: string | null
          option_b_ar?: string | null
          option_b_en?: string | null
          option_c_ar?: string | null
          option_c_en?: string | null
          option_d_ar?: string | null
          option_d_en?: string | null
          points?: number
          question_ar?: string
          question_en?: string
          question_order?: number
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_ratings: {
        Row: {
          comment: string | null
          course_id: string | null
          created_at: string
          id: string
          quiz_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          quiz_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          quiz_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      quiz_submissions: {
        Row: {
          answers: Json
          id: string
          quiz_id: string
          score: number | null
          student_id: string
          submitted_at: string
          total_points: number | null
          whatsapp_number: string | null
        }
        Insert: {
          answers?: Json
          id?: string
          quiz_id: string
          score?: number | null
          student_id: string
          submitted_at?: string
          total_points?: number | null
          whatsapp_number?: string | null
        }
        Update: {
          answers?: Json
          id?: string
          quiz_id?: string
          score?: number | null
          student_id?: string
          submitted_at?: string
          total_points?: number | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_submissions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          approved_by_dean: boolean
          approved_by_dean_at: string | null
          approved_by_dean_id: string | null
          approved_by_head: boolean
          approved_by_head_at: string | null
          approved_by_head_id: string | null
          approved_by_lecturer: boolean
          approved_by_lecturer_at: string | null
          approved_by_lecturer_id: string | null
          approved_by_vice_dean: boolean
          approved_by_vice_dean_at: string | null
          approved_by_vice_dean_environment: boolean
          approved_by_vice_dean_environment_at: string | null
          approved_by_vice_dean_environment_id: string | null
          approved_by_vice_dean_id: string | null
          approved_by_vice_dean_postgrad: boolean
          approved_by_vice_dean_postgrad_at: string | null
          approved_by_vice_dean_postgrad_id: string | null
          approved_by_vice_dean_students: boolean
          approved_by_vice_dean_students_at: string | null
          approved_by_vice_dean_students_id: string | null
          course_id: string
          created_at: string
          creator_id: string
          department_id: string | null
          description_ar: string | null
          description_en: string | null
          due_date: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          randomize_questions: boolean
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          results_published: boolean
          show_results_immediately: boolean
          title_ar: string
          title_en: string
          updated_at: string
          vice_dean_type: string[] | null
        }
        Insert: {
          approved_by_dean?: boolean
          approved_by_dean_at?: string | null
          approved_by_dean_id?: string | null
          approved_by_head?: boolean
          approved_by_head_at?: string | null
          approved_by_head_id?: string | null
          approved_by_lecturer?: boolean
          approved_by_lecturer_at?: string | null
          approved_by_lecturer_id?: string | null
          approved_by_vice_dean?: boolean
          approved_by_vice_dean_at?: string | null
          approved_by_vice_dean_environment?: boolean
          approved_by_vice_dean_environment_at?: string | null
          approved_by_vice_dean_environment_id?: string | null
          approved_by_vice_dean_id?: string | null
          approved_by_vice_dean_postgrad?: boolean
          approved_by_vice_dean_postgrad_at?: string | null
          approved_by_vice_dean_postgrad_id?: string | null
          approved_by_vice_dean_students?: boolean
          approved_by_vice_dean_students_at?: string | null
          approved_by_vice_dean_students_id?: string | null
          course_id: string
          created_at?: string
          creator_id: string
          department_id?: string | null
          description_ar?: string | null
          description_en?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          randomize_questions?: boolean
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          results_published?: boolean
          show_results_immediately?: boolean
          title_ar: string
          title_en: string
          updated_at?: string
          vice_dean_type?: string[] | null
        }
        Update: {
          approved_by_dean?: boolean
          approved_by_dean_at?: string | null
          approved_by_dean_id?: string | null
          approved_by_head?: boolean
          approved_by_head_at?: string | null
          approved_by_head_id?: string | null
          approved_by_lecturer?: boolean
          approved_by_lecturer_at?: string | null
          approved_by_lecturer_id?: string | null
          approved_by_vice_dean?: boolean
          approved_by_vice_dean_at?: string | null
          approved_by_vice_dean_environment?: boolean
          approved_by_vice_dean_environment_at?: string | null
          approved_by_vice_dean_environment_id?: string | null
          approved_by_vice_dean_id?: string | null
          approved_by_vice_dean_postgrad?: boolean
          approved_by_vice_dean_postgrad_at?: string | null
          approved_by_vice_dean_postgrad_id?: string | null
          approved_by_vice_dean_students?: boolean
          approved_by_vice_dean_students_at?: string | null
          approved_by_vice_dean_students_id?: string | null
          course_id?: string
          created_at?: string
          creator_id?: string
          department_id?: string | null
          description_ar?: string | null
          description_en?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          randomize_questions?: boolean
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          results_published?: boolean
          show_results_immediately?: boolean
          title_ar?: string
          title_en?: string
          updated_at?: string
          vice_dean_type?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_admin_notes: {
        Row: {
          kind: string
          notes: string | null
          registration_id: string
          updated_at: string
        }
        Insert: {
          kind: string
          notes?: string | null
          registration_id: string
          updated_at?: string
        }
        Update: {
          kind?: string
          notes?: string | null
          registration_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_ratings: {
        Row: {
          comment: string | null
          course_id: string | null
          created_at: string
          id: string
          rating: number
          schedule_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          rating: number
          schedule_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          rating?: number
          schedule_id?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_views: {
        Row: {
          id: string
          schedule_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          schedule_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          schedule_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_views_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "lecture_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      school_registrations: {
        Row: {
          address: string | null
          city: string
          created_at: string
          email: string
          id: string
          message: string | null
          phone: string
          principal_name: string
          school_name: string
          status: string
          student_count: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          phone: string
          principal_name: string
          school_name: string
          status?: string
          student_count?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          phone?: string
          principal_name?: string
          school_name?: string
          status?: string
          student_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stream_attendance: {
        Row: {
          duration_minutes: number | null
          id: string
          joined_at: string
          left_at: string | null
          stream_id: string
          user_id: string
        }
        Insert: {
          duration_minutes?: number | null
          id?: string
          joined_at?: string
          left_at?: string | null
          stream_id: string
          user_id: string
        }
        Update: {
          duration_minutes?: number | null
          id?: string
          joined_at?: string
          left_at?: string | null
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_attendance_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      student_presence_checkins: {
        Row: {
          accuracy_m: number | null
          course_id: string | null
          created_at: string
          hall_code: string | null
          id: string
          latitude: number | null
          longitude: number | null
          schedule_id: string | null
          selfie_url: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accuracy_m?: number | null
          course_id?: string | null
          created_at?: string
          hall_code?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          schedule_id?: string | null
          selfie_url?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accuracy_m?: number | null
          course_id?: string | null
          created_at?: string
          hall_code?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          schedule_id?: string | null
          selfie_url?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      student_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          created_at: string
          episode_id: string
          id: string
          user_id: string
          watched_seconds: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          created_at?: string
          episode_id: string
          id?: string
          user_id: string
          watched_seconds?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          created_at?: string
          episode_id?: string
          id?: string
          user_id?: string
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "course_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      student_results: {
        Row: {
          academic_degree: string
          created_at: string
          created_by: string
          department_name: string
          grade: number | null
          id: string
          institution_id: string
          institution_type: string
          notes: string | null
          rating: string
          student_name: string
          student_user_id: string | null
          updated_at: string
        }
        Insert: {
          academic_degree?: string
          created_at?: string
          created_by: string
          department_name: string
          grade?: number | null
          id?: string
          institution_id: string
          institution_type?: string
          notes?: string | null
          rating?: string
          student_name: string
          student_user_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_degree?: string
          created_at?: string
          created_by?: string
          department_name?: string
          grade?: number | null
          id?: string
          institution_id?: string
          institution_type?: string
          notes?: string | null
          rating?: string
          student_name?: string
          student_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      user_subscriptions: {
        Row: {
          amount_paid: number
          course_id: string
          created_at: string
          expires_at: string | null
          id: string
          level_number: number
          plan_type: string
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          course_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          level_number?: number
          plan_type?: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          course_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          level_number?: number
          plan_type?: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
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
      approved_colleges_public: {
        Row: {
          city: string | null
          college_name: string | null
          dean_name: string | null
          id: string | null
          logo_url: string | null
          student_count: number | null
          type: string | null
          university_name: string | null
        }
        Insert: {
          city?: string | null
          college_name?: string | null
          dean_name?: string | null
          id?: string | null
          logo_url?: string | null
          student_count?: number | null
          type?: string | null
          university_name?: string | null
        }
        Update: {
          city?: string | null
          college_name?: string | null
          dean_name?: string | null
          id?: string | null
          logo_url?: string | null
          student_count?: number | null
          type?: string | null
          university_name?: string | null
        }
        Relationships: []
      }
      approved_institutes_public: {
        Row: {
          city: string | null
          director_name: string | null
          id: string | null
          institute_name: string | null
          logo_url: string | null
          student_count: number | null
        }
        Insert: {
          city?: string | null
          director_name?: string | null
          id?: string | null
          institute_name?: string | null
          logo_url?: string | null
          student_count?: number | null
        }
        Update: {
          city?: string | null
          director_name?: string | null
          id?: string | null
          institute_name?: string | null
          logo_url?: string | null
          student_count?: number | null
        }
        Relationships: []
      }
      approved_schools_public: {
        Row: {
          city: string | null
          id: string | null
          school_name: string | null
          student_count: number | null
        }
        Insert: {
          city?: string | null
          id?: string | null
          school_name?: string | null
          student_count?: number | null
        }
        Update: {
          city?: string | null
          id?: string | null
          school_name?: string | null
          student_count?: number | null
        }
        Relationships: []
      }
      institution_quiz_questions_safe: {
        Row: {
          created_at: string | null
          id: string | null
          option_a_ar: string | null
          option_a_en: string | null
          option_b_ar: string | null
          option_b_en: string | null
          option_c_ar: string | null
          option_c_en: string | null
          option_d_ar: string | null
          option_d_en: string | null
          points: number | null
          question_ar: string | null
          question_en: string | null
          question_order: number | null
          quiz_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          option_a_ar?: string | null
          option_a_en?: string | null
          option_b_ar?: string | null
          option_b_en?: string | null
          option_c_ar?: string | null
          option_c_en?: string | null
          option_d_ar?: string | null
          option_d_en?: string | null
          points?: number | null
          question_ar?: string | null
          question_en?: string | null
          question_order?: number | null
          quiz_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          option_a_ar?: string | null
          option_a_en?: string | null
          option_b_ar?: string | null
          option_b_en?: string | null
          option_c_ar?: string | null
          option_c_en?: string | null
          option_d_ar?: string | null
          option_d_en?: string | null
          points?: number | null
          question_ar?: string | null
          question_en?: string | null
          question_order?: number | null
          quiz_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "institution_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions_safe: {
        Row: {
          created_at: string | null
          id: string | null
          option_a_ar: string | null
          option_a_en: string | null
          option_b_ar: string | null
          option_b_en: string | null
          option_c_ar: string | null
          option_c_en: string | null
          option_d_ar: string | null
          option_d_en: string | null
          points: number | null
          question_ar: string | null
          question_en: string | null
          question_order: number | null
          quiz_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          option_a_ar?: string | null
          option_a_en?: string | null
          option_b_ar?: string | null
          option_b_en?: string | null
          option_c_ar?: string | null
          option_c_en?: string | null
          option_d_ar?: string | null
          option_d_en?: string | null
          points?: number | null
          question_ar?: string | null
          question_en?: string | null
          question_order?: number | null
          quiz_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          option_a_ar?: string | null
          option_a_en?: string | null
          option_b_ar?: string | null
          option_b_en?: string | null
          option_c_ar?: string | null
          option_c_en?: string | null
          option_d_ar?: string | null
          option_d_en?: string | null
          points?: number | null
          question_ar?: string | null
          question_en?: string | null
          question_order?: number | null
          quiz_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_submissions_safe: {
        Row: {
          answers: Json | null
          id: string | null
          quiz_id: string | null
          score: number | null
          student_id: string | null
          submitted_at: string | null
          total_points: number | null
        }
        Insert: {
          answers?: Json | null
          id?: string | null
          quiz_id?: string | null
          score?: number | null
          student_id?: string | null
          submitted_at?: string | null
          total_points?: number | null
        }
        Update: {
          answers?: Json | null
          id?: string | null
          quiz_id?: string | null
          score?: number | null
          student_id?: string | null
          submitted_at?: string | null
          total_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_submissions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _protected_owner_emails: { Args: never; Returns: string[] }
      assign_faculty_department: {
        Args: {
          p_email: string
          p_full_name: string
          p_new_department_id: string
          p_phone: string
          p_specific_role: string
          p_user_id: string
        }
        Returns: undefined
      }
      calculate_weekly_top_courses: { Args: never; Returns: undefined }
      claim_department_codes: {
        Args: {
          _codes: string[]
          _email: string
          _full_name: string
          _phone: string
          _user_id: string
        }
        Returns: Json
      }
      claim_department_invitation: {
        Args: { _code: string; _user_id: string }
        Returns: Json
      }
      complete_password_change_profile_update: {
        Args: { p_user_id?: string }
        Returns: {
          after_must_change_password: boolean
          before_must_change_password: boolean
          profile_email: string
          profile_updated_at: string
          profile_user_id: string
          rows_updated: number
          temporary_password_column_present: boolean
        }[]
      }
      complete_signup: {
        Args: {
          p_additional_certs_urls?: string[]
          p_email: string
          p_full_name: string
          p_id_photo_url?: string
          p_live_photo_url?: string
          p_phone: string
          p_platform?: string
          p_role: string
          p_university_cert_url?: string
          p_user_id: string
        }
        Returns: Json
      }
      confirm_registration_email: {
        Args: { _email: string }
        Returns: undefined
      }
      consume_institution_invitation: {
        Args: { _code: string }
        Returns: {
          error_message: string
          institution_id: string
          institution_name: string
          is_valid: boolean
          kind: string
          role: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      delete_test_accounts: { Args: never; Returns: undefined }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      ensure_owner_role: { Args: never; Returns: undefined }
      get_cleanup_candidates: {
        Args: never
        Returns: {
          approved: boolean
          auth_user_id: string
          email: string
          evidence: string
          has_profile: boolean
          has_role_row: boolean
          role_name: string
        }[]
      }
      get_institution_quiz_for_student: {
        Args: { _quiz_id: string }
        Returns: {
          id: string
          option_a_ar: string
          option_a_en: string
          option_b_ar: string
          option_b_en: string
          option_c_ar: string
          option_c_en: string
          option_d_ar: string
          option_d_en: string
          points: number
          question_ar: string
          question_en: string
          question_order: number
        }[]
      }
      get_institution_student_subscriptions: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_search?: string
          p_sort_by?: string
          p_sort_dir?: string
        }
        Returns: Json
      }
      get_institution_people_statistics: {
        Args: { p_institution_id: string; p_institution_type: string }
        Returns: Json
      }
      get_my_submission_whatsapp: {
        Args: { _submission_id: string }
        Returns: string
      }
      get_platform_statistics: { Args: { p_scope?: string }; Returns: Json }
      get_platform_statistics_legacy: {
        Args: { p_scope?: string }
        Returns: Json
      }
      get_platform_stats: { Args: never; Returns: Json }
      get_university_platform_statistics: { Args: never; Returns: Json }
      get_profile_count: { Args: never; Returns: number }
      get_profile_count_by_role: { Args: { _role: string }; Returns: number }
      get_quiz_review: {
        Args: { _quiz_id: string }
        Returns: {
          correct_answer: string
          expected_answer: string
          id: string
          image_url: string
          option_a_ar: string
          option_a_en: string
          option_b_ar: string
          option_b_en: string
          option_c_ar: string
          option_c_en: string
          option_d_ar: string
          option_d_en: string
          points: number
          question_ar: string
          question_en: string
          question_order: number
          question_type: string
        }[]
      }
      get_test_registration_emails: { Args: never; Returns: string[] }
      get_user_email: { Args: { _user_id: string }; Returns: string }
      get_user_sub_role: { Args: { _user_id: string }; Returns: string }
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
      is_department_member: {
        Args: { _department_id: string; _user_id: string }
        Returns: boolean
      }
      is_email_confirmed: { Args: { _user_id: string }; Returns: boolean }
      is_institution_admin: {
        Args: {
          _institution_id: string
          _institution_type: string
          _user_id: string
        }
        Returns: boolean
      }
      is_leadership: { Args: { _user_id: string }; Returns: boolean }
      leadership_institution_ids: {
        Args: { _user_id: string }
        Returns: {
          institution_id: string
          institution_type: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      quiz_results_approved: { Args: { _quiz_id: string }; Returns: boolean }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      save_faculty_member_tx: {
        Args: {
          p_app_role: Database["public"]["Enums"]["app_role"]
          p_department_id: string
          p_email: string
          p_extra: Json
          p_full_name: string
          p_institution_id: string
          p_institution_type: string
          p_invitation_code: string
          p_phone: string
          p_profile_role: string
          p_specific_role: string
          p_user_id: string
        }
        Returns: undefined
      }
      save_faculty_member_v2: {
        Args: {
          p_app_role: Database["public"]["Enums"]["app_role"]
          p_email: string
          p_extra: Json
          p_full_name: string
          p_institution_id: string
          p_institution_type: string
          p_phone: string
          p_profile_role: string
          p_specific_role: string
          p_user_id: string
        }
        Returns: undefined
      }
      schedule_fully_approved: { Args: { _id: string }; Returns: boolean }
      snapshot_accounts_before_cleanup: { Args: never; Returns: undefined }
      submit_quiz: {
        Args: { _answers: Json; _quiz_id: string; _whatsapp?: string }
        Returns: Json
      }
      update_faculty_member_tx: {
        Args: {
          p_app_role: Database["public"]["Enums"]["app_role"]
          p_avatar_url: string
          p_extra: Json
          p_full_name: string
          p_institution_id: string
          p_institution_type: string
          p_new_department_id: string
          p_old_department_id: string
          p_phone: string
          p_profile_role: string
          p_specific_role: string
          p_user_id: string
        }
        Returns: undefined
      }
      user_in_department: {
        Args: { _dept: string; _user: string }
        Returns: boolean
      }
      user_in_my_leadership_institution: {
        Args: { _target_user: string }
        Returns: boolean
      }
      verify_department_codes: {
        Args: { _codes: string[] }
        Returns: {
          department_code: string
          department_id: string
          department_name: string
          institution_id: string
          institution_type: string
        }[]
      }
      verify_department_invitation: {
        Args: { _code: string }
        Returns: {
          department_id: string
          full_name: string
          is_valid: boolean
          role: string
        }[]
      }
      verify_institution_invitation: {
        Args: { _code: string }
        Returns: {
          institution_id: string
          institution_name: string
          is_valid: boolean
          kind: string
          role: string
        }[]
      }
      verify_no_protected_owner_in_candidates: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "lecturer"
        | "student"
        | "personal"
        | "publisher"
        | "seller"
        | "school_student"
        | "parent"
        | "school"
        | "teacher"
        | "department_head"
        | "vice_dean"
        | "dean"
        | "training_center"
        | "language_center"
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
      app_role: [
        "admin",
        "lecturer",
        "student",
        "personal",
        "publisher",
        "seller",
        "school_student",
        "parent",
        "school",
        "teacher",
        "department_head",
        "vice_dean",
        "dean",
        "training_center",
        "language_center",
      ],
    },
  },
} as const
