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
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          related_to_id: string
          related_to_type: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          related_to_id: string
          related_to_type: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          related_to_id?: string
          related_to_type?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      billing_items: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string
          due_date: string
          id: string
          item_type: string
          lease_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description: string
          due_date: string
          id?: string
          item_type: string
          lease_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string
          due_date?: string
          id?: string
          item_type?: string
          lease_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_items_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "active_leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_items_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_items_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "property_occupancy"
            referencedColumns: ["current_lease_id"]
          },
          {
            foreignKeyName: "billing_items_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "unpaid_billing_summary"
            referencedColumns: ["lease_id"]
          },
        ]
      }
      lease_agreements: {
        Row: {
          created_at: string | null
          created_by: string | null
          deposit_amount: number
          end_date: string | null
          id: string
          monthly_rent: number
          notes: string | null
          property_id: string
          start_date: string
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deposit_amount: number
          end_date?: string | null
          id?: string
          monthly_rent: number
          notes?: string | null
          property_id: string
          start_date: string
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deposit_amount?: number
          end_date?: string | null
          id?: string
          monthly_rent?: number
          notes?: string | null
          property_id?: string
          start_date?: string
          status?: string
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
      meter_readings: {
        Row: {
          created_at: string | null
          id: string
          meter_id: string
          notes: string | null
          reading_date: string
          reading_value: number
          recorded_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          meter_id: string
          notes?: string | null
          reading_date: string
          reading_value: number
          recorded_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          meter_id?: string
          notes?: string | null
          reading_date?: string
          reading_value?: number
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "meters"
            referencedColumns: ["id"]
          },
        ]
      }
      meters: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          meter_number: string
          meter_type: string
          property_id: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          meter_number: string
          meter_type: string
          property_id: string
          unit: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          meter_number?: string
          meter_type?: string
          property_id?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_financial_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_occupancy"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          billing_item_id: string
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          billing_item_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          billing_item_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_billing_item_id_fkey"
            columns: ["billing_item_id"]
            isOneToOne: false
            referencedRelation: "billing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_billing_item_id_fkey"
            columns: ["billing_item_id"]
            isOneToOne: false
            referencedRelation: "billing_with_payments"
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
          property_type: string
          size_sqm: number | null
          status: string
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
          property_type: string
          size_sqm?: number | null
          status?: string
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
          property_type?: string
          size_sqm?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      property_expenses: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string
          expense_date: string
          expense_type: string
          id: string
          property_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description: string
          expense_date: string
          expense_type: string
          id?: string
          property_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string
          expense_date?: string
          expense_type?: string
          id?: string
          property_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_financial_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_occupancy"
            referencedColumns: ["id"]
          },
        ]
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
          status: string
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
          status?: string
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
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      utility_bills: {
        Row: {
          billing_item_id: string | null
          billing_period_end: string
          billing_period_start: string
          consumption: number
          created_at: string | null
          end_reading_id: string
          id: string
          lease_id: string
          meter_id: string
          start_reading_id: string
          total_amount: number
          unit_price: number
        }
        Insert: {
          billing_item_id?: string | null
          billing_period_end: string
          billing_period_start: string
          consumption: number
          created_at?: string | null
          end_reading_id: string
          id?: string
          lease_id: string
          meter_id: string
          start_reading_id: string
          total_amount: number
          unit_price: number
        }
        Update: {
          billing_item_id?: string | null
          billing_period_end?: string
          billing_period_start?: string
          consumption?: number
          created_at?: string | null
          end_reading_id?: string
          id?: string
          lease_id?: string
          meter_id?: string
          start_reading_id?: string
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "utility_bills_billing_item_id_fkey"
            columns: ["billing_item_id"]
            isOneToOne: false
            referencedRelation: "billing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_bills_billing_item_id_fkey"
            columns: ["billing_item_id"]
            isOneToOne: false
            referencedRelation: "billing_with_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_bills_end_reading_id_fkey"
            columns: ["end_reading_id"]
            isOneToOne: false
            referencedRelation: "latest_meter_readings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_bills_end_reading_id_fkey"
            columns: ["end_reading_id"]
            isOneToOne: false
            referencedRelation: "meter_readings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_bills_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "active_leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_bills_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_bills_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "property_occupancy"
            referencedColumns: ["current_lease_id"]
          },
          {
            foreignKeyName: "utility_bills_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "unpaid_billing_summary"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "utility_bills_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_bills_start_reading_id_fkey"
            columns: ["start_reading_id"]
            isOneToOne: false
            referencedRelation: "latest_meter_readings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_bills_start_reading_id_fkey"
            columns: ["start_reading_id"]
            isOneToOne: false
            referencedRelation: "meter_readings"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_prices: {
        Row: {
          created_at: string | null
          effective_date: string
          id: string
          price_per_unit: number
          updated_at: string | null
          utility_type: string
        }
        Insert: {
          created_at?: string | null
          effective_date: string
          id?: string
          price_per_unit: number
          updated_at?: string | null
          utility_type: string
        }
        Update: {
          created_at?: string | null
          effective_date?: string
          id?: string
          price_per_unit?: number
          updated_at?: string | null
          utility_type?: string
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
          monthly_rent: number | null
          notes: string | null
          property_address: string | null
          property_id: string | null
          property_name: string | null
          property_type: string | null
          start_date: string | null
          status: string | null
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
      billing_with_payments: {
        Row: {
          amount: number | null
          balance: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string | null
          is_fully_paid: boolean | null
          item_type: string | null
          lease_id: string | null
          status: string | null
          total_paid: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_items_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "active_leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_items_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_items_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "property_occupancy"
            referencedColumns: ["current_lease_id"]
          },
          {
            foreignKeyName: "billing_items_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "unpaid_billing_summary"
            referencedColumns: ["lease_id"]
          },
        ]
      }
      latest_meter_readings: {
        Row: {
          created_at: string | null
          id: string | null
          meter_id: string | null
          meter_number: string | null
          meter_type: string | null
          notes: string | null
          property_id: string | null
          property_name: string | null
          reading_date: string | null
          reading_value: number | null
          recorded_by: string | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_financial_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_occupancy"
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
          status: string | null
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
          property_type: string | null
          size_sqm: number | null
          status: string | null
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
      unpaid_billing_summary: {
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
      get_current_tenant_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_landlord: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

