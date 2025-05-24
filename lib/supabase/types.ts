export interface Database {
  public: {
    Tables: {
      podcasts: {
        Row: {
          id: string
          title: string
          host_name: string
          category: string
          script: string
          voice_id: string
          voice_name: string
          user_id: string
          created_at: string
          updated_at: string
          audio_url: string | null
          duration: number | null
          listens: number
          featured: boolean
          description: string | null
        }
        Insert: {
          id?: string
          title: string
          host_name: string
          category: string
          script: string
          voice_id: string
          voice_name: string
          user_id: string
          created_at?: string
          updated_at?: string
          audio_url?: string | null
          duration?: number | null
          listens?: number
          featured?: boolean
          description?: string | null
        }
        Update: {
          id?: string
          title?: string
          host_name?: string
          category?: string
          script?: string
          voice_id?: string
          voice_name?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          audio_url?: string | null
          duration?: number | null
          listens?: number
          featured?: boolean
          description?: string | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
