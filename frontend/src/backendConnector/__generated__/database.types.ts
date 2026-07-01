export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_type: Database["public"]["Enums"]["file_type"] | null
          file_url: string
          id: string
          related_to_id: string
          related_to_type: Database["public"]["Enums"]["related_to_type"]
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: Database["public"]["Enums"]["file_type"] | null
          file_url: string
          id?: string
          related_to_id: string
          related_to_type: Database["public"]["Enums"]["related_to_type"]
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: Database["public"]["Enums"]["file_type"] | null
          file_url?: string
          id?: string
          related_to_id?: string
          related_to_type?: Database["public"]["Enums"]["related_to_type"]
        }
        Relationships: []
      }
      lease_agreements: {
        Row: {
          created_at: string | null
          created_by: string | null
          deposit_amount: number
          end_date: string | null
          id: string
          lease_status: Database["public"]["Enums"]["lease_status"]
          monthly_rent: number
          notes: string | null
          property_id: string
          start_date: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deposit_amount: number
          end_date?: string | null
          id?: string
          lease_status?: Database["public"]["Enums"]["lease_status"]
          monthly_rent: number
          notes?: string | null
          property_id: string
          start_date: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deposit_amount?: number
          end_date?: string | null
          id?: string
          lease_status?: Database["public"]["Enums"]["lease_status"]
          monthly_rent?: number
          notes?: string | null
          property_id?: string
          start_date?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lease_agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_financial_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "lease_agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_occupancy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_agreements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          bedrooms: number | null
          created_at: string | null
          created_by: string | null
          deposit_amount: number
          id: string
          monthly_rent: number
          name: string
          notes: string | null
          property_status: Database["public"]["Enums"]["property_status"]
          property_type: Database["public"]["Enums"]["property_type"]
          size_sqm: number | null
          updated_at: string | null
        }
        Insert: {
          address: string
          bedrooms?: number | null
          created_at?: string | null
          created_by?: string | null
          deposit_amount: number
          id?: string
          monthly_rent: number
          name: string
          notes?: string | null
          property_status: Database["public"]["Enums"]["property_status"]
          property_type: Database["public"]["Enums"]["property_type"]
          size_sqm?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          bedrooms?: number | null
          created_at?: string | null
          created_by?: string | null
          deposit_amount?: number
          id?: string
          monthly_rent?: number
          name?: string
          notes?: string | null
          property_status?: Database["public"]["Enums"]["property_status"]
          property_type?: Database["public"]["Enums"]["property_type"]
          size_sqm?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          id: string
          id_document_number: string | null
          last_name: string
          notes: string | null
          phone: string
          tenant_status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          id?: string
          id_document_number?: string | null
          last_name: string
          notes?: string | null
          phone: string
          tenant_status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          id?: string
          id_document_number?: string | null
          last_name?: string
          notes?: string | null
          phone?: string
          tenant_status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string
          due_date: string
          id: string
          lease_id: string | null
          property_id: string | null
          transaction_status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description: string
          due_date: string
          id?: string
          lease_id?: string | null
          property_id?: string | null
          transaction_status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string
          due_date?: string
          id?: string
          lease_id?: string | null
          property_id?: string | null
          transaction_status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "active_leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "property_occupancy"
            referencedColumns: ["current_lease_id"]
          },
          {
            foreignKeyName: "transactions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "unpaid_transactions_summary"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_financial_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_occupancy"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_leases: {
        Row: {
          created_at: string | null
          created_by: string | null
          days_active: number | null
          days_until_end: number | null
          deposit_amount: number | null
          end_date: string | null
          id: string | null
          lease_status: Database["public"]["Enums"]["lease_status"] | null
          monthly_rent: number | null
          notes: string | null
          property_address: string | null
          property_id: string | null
          property_name: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          start_date: string | null
          tenant_email: string | null
          tenant_id: string | null
          tenant_name: string | null
          tenant_phone: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lease_agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_financial_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "lease_agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_occupancy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_agreements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      property_financial_summary: {
        Row: {
          address: string | null
          monthly_rent: number | null
          net_profit: number | null
          property_id: string | null
          property_name: string | null
          property_status: Database["public"]["Enums"]["property_status"] | null
          total_expenses: number | null
          total_income: number | null
        }
        Relationships: []
      }
      property_occupancy: {
        Row: {
          address: string | null
          bedrooms: number | null
          created_at: string | null
          created_by: string | null
          current_lease_id: string | null
          current_rent: number | null
          current_tenant_name: string | null
          deposit_amount: number | null
          id: string | null
          lease_end: string | null
          lease_start: string | null
          monthly_rent: number | null
          name: string | null
          notes: string | null
          property_status: Database["public"]["Enums"]["property_status"] | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          size_sqm: number | null
          tenant_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lease_agreements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      unpaid_transactions_summary: {
        Row: {
          earliest_due_date: string | null
          lease_id: string | null
          overdue_items_count: number | null
          property_id: string | null
          property_name: string | null
          tenant_id: string | null
          tenant_name: string | null
          total_overdue_amount: number | null
          total_unpaid_amount: number | null
          unpaid_items_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lease_agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_financial_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "lease_agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_occupancy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_agreements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      get_current_tenant_id: { Args: never; Returns: string }
      get_tenant_lease_ids: { Args: never; Returns: string[] }
      get_tenant_visible_property_ids: { Args: never; Returns: string[] }
      get_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_landlord: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "tenant" | "landlord" | "admin"
      file_type: "image" | "video" | "pdf" | "document" | "other"
      lease_status: "active" | "expired" | "terminated"
      property_status: "available" | "occupied" | "inactive"
      property_type: "apartment" | "house" | "commercial" | "room"
      related_to_type:
        | "property"
        | "tenant"
        | "lease"
        | "maintenance"
        | "meter_reading"
        | "expense"
      tenant_status: "active" | "past" | "applicant"
      transaction_status: "pending" | "paid" | "overdue"
      transaction_type:
        | "rent"
        | "utility"
        | "expense"
        | "payment"
        | "withdraw"
        | "fee"
        | "other"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["tenant", "landlord", "admin"],
      file_type: ["image", "video", "pdf", "document", "other"],
      lease_status: ["active", "expired", "terminated"],
      property_status: ["available", "occupied", "inactive"],
      property_type: ["apartment", "house", "commercial", "room"],
      related_to_type: [
        "property",
        "tenant",
        "lease",
        "maintenance",
        "meter_reading",
        "expense",
      ],
      tenant_status: ["active", "past", "applicant"],
      transaction_status: ["pending", "paid", "overdue"],
      transaction_type: [
        "rent",
        "utility",
        "expense",
        "payment",
        "withdraw",
        "fee",
        "other",
      ],
    },
  },
} as const

