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
          admin_notes: string | null
          city: string
          college_name: string
          created_at: string
          dean_name: string
          email: string
          id: string
          message: string | null
          phone: string
          status: string
          student_count: number | null
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          city: string
          college_name: string
          created_at?: string
          dean_name: string
          email: string
          id?: string
          message?: string | null
          phone: string
          status?: string
          student_count?: number | null
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          city?: string
          college_name?: string
          created_at?: string
          dean_name?: string
          email?: string
          id?: string
          message?: string | null
          phone?: string
          status?: string
          student_count?: number | null
          type?: string
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
          episode_count: number
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
          episode_count?: number
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
          episode_count?: number
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
        Relationships: []
      }
      department_members: {
        Row: {
          created_at: string
          date_of_birth: string | null
          department_id: string
          full_name: string
          id: string
          invitation_code: string | null
          photo_url: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          department_id: string
          full_name: string
          id?: string
          invitation_code?: string | null
          photo_url?: string | null
          role?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          department_id?: string
          full_name?: string
          id?: string
          invitation_code?: string | null
          photo_url?: string | null
          role?: string
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
          admin_notes: string | null
          city: string
          created_at: string
          director_name: string
          email: string
          id: string
          institute_name: string
          message: string | null
          phone: string
          specialization: string | null
          status: string
          student_count: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          city: string
          created_at?: string
          director_name: string
          email: string
          id?: string
          institute_name: string
          message?: string | null
          phone: string
          specialization?: string | null
          status?: string
          student_count?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          city?: string
          created_at?: string
          director_name?: string
          email?: string
          id?: string
          institute_name?: string
          message?: string | null
          phone?: string
          specialization?: string | null
          status?: string
          student_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      lecture_schedules: {
        Row: {
          course_id: string
          created_at: string
          creator_id: string
          end_time: string | null
          id: string
          location_ar: string | null
          location_en: string | null
          notes_ar: string | null
          notes_en: string | null
          schedule_type: string
          scheduled_date: string
          start_time: string | null
          title_ar: string
          title_en: string
        }
        Insert: {
          course_id: string
          created_at?: string
          creator_id: string
          end_time?: string | null
          id?: string
          location_ar?: string | null
          location_en?: string | null
          notes_ar?: string | null
          notes_en?: string | null
          schedule_type?: string
          scheduled_date: string
          start_time?: string | null
          title_ar: string
          title_en: string
        }
        Update: {
          course_id?: string
          created_at?: string
          creator_id?: string
          end_time?: string | null
          id?: string
          location_ar?: string | null
          location_en?: string | null
          notes_ar?: string | null
          notes_en?: string | null
          schedule_type?: string
          scheduled_date?: string
          start_time?: string | null
          title_ar?: string
          title_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecture_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message_ar: string
          message_en: string
          notification_type: string
          recipient_id: string | null
          sender_id: string
          target_role: string | null
          title_ar: string
          title_en: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message_ar?: string
          message_en?: string
          notification_type?: string
          recipient_id?: string | null
          sender_id: string
          target_role?: string | null
          title_ar?: string
          title_en?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message_ar?: string
          message_en?: string
          notification_type?: string
          recipient_id?: string | null
          sender_id?: string
          target_role?: string | null
          title_ar?: string
          title_en?: string
        }
        Relationships: []
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
          platform: string
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
          platform?: string
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
          platform?: string
          role?: string
          university_cert_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
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
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
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
        }
        Insert: {
          answers?: Json
          id?: string
          quiz_id: string
          score?: number | null
          student_id: string
          submitted_at?: string
          total_points?: number | null
        }
        Update: {
          answers?: Json
          id?: string
          quiz_id?: string
          score?: number | null
          student_id?: string
          submitted_at?: string
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
      quizzes: {
        Row: {
          course_id: string
          created_at: string
          creator_id: string
          description_ar: string | null
          description_en: string | null
          due_date: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          creator_id: string
          description_ar?: string | null
          description_en?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          creator_id?: string
          description_ar?: string | null
          description_en?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      school_registrations: {
        Row: {
          address: string | null
          admin_notes: string | null
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
          admin_notes?: string | null
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
          admin_notes?: string | null
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
          updated_at?: string
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
          id: string | null
          student_count: number | null
          type: string | null
        }
        Insert: {
          city?: string | null
          college_name?: string | null
          id?: string | null
          student_count?: number | null
          type?: string | null
        }
        Update: {
          city?: string | null
          college_name?: string | null
          id?: string | null
          student_count?: number | null
          type?: string | null
        }
        Relationships: []
      }
      approved_institutes_public: {
        Row: {
          city: string | null
          id: string | null
          institute_name: string | null
          specialization: string | null
          student_count: number | null
        }
        Insert: {
          city?: string | null
          id?: string | null
          institute_name?: string | null
          specialization?: string | null
          student_count?: number | null
        }
        Update: {
          city?: string | null
          id?: string | null
          institute_name?: string | null
          specialization?: string | null
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
    }
    Functions: {
      calculate_weekly_top_courses: { Args: never; Returns: undefined }
      complete_signup:
        | {
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
        | {
            Args: {
              p_additional_certs_urls?: string[]
              p_email: string
              p_force_approve?: boolean
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
      get_platform_stats: { Args: never; Returns: Json }
      get_profile_count: { Args: never; Returns: number }
      get_profile_count_by_role: { Args: { _role: string }; Returns: number }
      get_user_email: { Args: { _user_id: string }; Returns: string }
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
      ],
    },
  },
} as const
