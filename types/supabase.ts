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
      access_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          status: string
          transfer_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          status?: string
          transfer_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          status?: string
          transfer_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      downloads: {
        Row: {
          connection_code: string | null
          download_path: string | null
          downloaded_at: string
          file_id: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          transfer_id: string | null
          transfer_title: string | null
          user_id: string | null
        }
        Insert: {
          connection_code?: string | null
          download_path?: string | null
          downloaded_at?: string
          file_id?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          transfer_id?: string | null
          transfer_title?: string | null
          user_id?: string | null
        }
        Update: {
          connection_code?: string | null
          download_path?: string | null
          downloaded_at?: string
          file_id?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          transfer_id?: string | null
          transfer_title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "downloads_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "transfer_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downloads_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      transfer_access: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string
          transfer_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by: string
          transfer_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_access_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_files: {
        Row: {
          created_at: string
          download_count: number
          file_name: string
          file_size: number
          file_type: string
          id: string
          storage_path: string
          transfer_id: string
        }
        Insert: {
          created_at?: string
          download_count?: number
          file_name: string
          file_size: number
          file_type: string
          id?: string
          storage_path: string
          transfer_id: string
        }
        Update: {
          created_at?: string
          download_count?: number
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          storage_path?: string
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_files_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          connection_code: string
          created_at: string
          description: string | null
          download_count: number
          expires_at: string | null
          file_count: number
          id: string
          is_active: boolean
          is_public: boolean
          title: string
          total_size: number
          user_id: string
        }
        Insert: {
          connection_code: string
          created_at?: string
          description?: string | null
          download_count?: number
          expires_at?: string | null
          file_count?: number
          id?: string
          is_active?: boolean
          is_public?: boolean
          title: string
          total_size?: number
          user_id: string
        }
        Update: {
          connection_code?: string
          created_at?: string
          description?: string | null
          download_count?: number
          expires_at?: string | null
          file_count?: number
          id?: string
          is_active?: boolean
          is_public?: boolean
          title?: string
          total_size?: number
          user_id?: string
        }
        Relationships: []
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
