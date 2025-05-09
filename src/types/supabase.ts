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
      copy_trading_relationships: {
        Row: {
          created_at: string
          id: string
          status: string
          trader_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status: string
          trader_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          trader_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copy_trading_relationships_trader_id_fkey"
            columns: ["trader_id"]
            isOneToOne: false
            referencedRelation: "traders"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          amount: number
          created_at: string
          id: string
          screenshot_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          screenshot_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          screenshot_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      login_history: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          login_time: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          login_time?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          login_time?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          country: string | null
          id: number
          is_authenticated: boolean | null
          text: string
          timestamp: string
          username: string
        }
        Insert: {
          country?: string | null
          id?: number
          is_authenticated?: boolean | null
          text: string
          timestamp?: string
          username: string
        }
        Update: {
          country?: string | null
          id?: number
          is_authenticated?: boolean | null
          text?: string
          timestamp?: string
          username?: string
        }
        Relationships: []
      }
      trader_applications: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          followers_count: number | null
          id: string
          name: string
          status: string | null
          total_profit: number | null
          updated_at: string | null
          user_id: string | null
          win_rate: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          id?: string
          name: string
          status?: string | null
          total_profit?: number | null
          updated_at?: string | null
          user_id?: string | null
          win_rate?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          id?: string
          name?: string
          status?: string | null
          total_profit?: number | null
          updated_at?: string | null
          user_id?: string | null
          win_rate?: number | null
        }
        Relationships: []
      }
      trader_trades: {
        Row: {
          closed_at: string | null
          created_at: string
          entry_price: number
          exit_price: number | null
          id: string
          pair: string
          profit_loss: number | null
          quantity: number
          status: string
          trader_id: string | null
          type: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          entry_price: number
          exit_price?: number | null
          id?: string
          pair: string
          profit_loss?: number | null
          quantity: number
          status: string
          trader_id?: string | null
          type: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          pair?: string
          profit_loss?: number | null
          quantity?: number
          status?: string
          trader_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trader_trades_trader_id_fkey"
            columns: ["trader_id"]
            isOneToOne: false
            referencedRelation: "traders"
            referencedColumns: ["id"]
          },
        ]
      }
      traders: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          followers_count: number | null
          id: string
          name: string
          total_profit: number | null
          win_rate: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          followers_count?: number | null
          id?: string
          name: string
          total_profit?: number | null
          win_rate?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          followers_count?: number | null
          id?: string
          name?: string
          total_profit?: number | null
          win_rate?: number | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          amount: number
          closed_at: string | null
          created_at: string | null
          crypto_pair: string
          entry_price: number
          expiry_time: string | null
          id: string
          leverage: number | null
          profit_loss: number | null
          status: string
          trade_type: string
          user_id: string
        }
        Insert: {
          amount: number
          closed_at?: string | null
          created_at?: string | null
          crypto_pair: string
          entry_price: number
          expiry_time?: string | null
          id?: string
          leverage?: number | null
          profit_loss?: number | null
          status: string
          trade_type: string
          user_id: string
        }
        Update: {
          amount?: number
          closed_at?: string | null
          created_at?: string | null
          crypto_pair?: string
          entry_price?: number
          expiry_time?: string | null
          id?: string
          leverage?: number | null
          profit_loss?: number | null
          status?: string
          trade_type?: string
          user_id?: string
        }
        Relationships: []
      }
      trading_history: {
        Row: {
          ai_reasoning: string | null
          amount: number
          closed_at: string | null
          created_at: string | null
          crypto_pair: string
          duration_minutes: string | null
          expiration_time: string | null
          id: string
          original_balance: number | null
          profit_loss: number | null
          status: string
          trade_type: string
          user_id: string
        }
        Insert: {
          ai_reasoning?: string | null
          amount: number
          closed_at?: string | null
          created_at?: string | null
          crypto_pair: string
          duration_minutes?: string | null
          expiration_time?: string | null
          id?: string
          original_balance?: number | null
          profit_loss?: number | null
          status: string
          trade_type: string
          user_id: string
        }
        Update: {
          ai_reasoning?: string | null
          amount?: number
          closed_at?: string | null
          created_at?: string | null
          crypto_pair?: string
          duration_minutes?: string | null
          expiration_time?: string | null
          id?: string
          original_balance?: number | null
          profit_loss?: number | null
          status?: string
          trade_type?: string
          user_id?: string
        }
        Relationships: []
      }
      trading_settings: {
        Row: {
          created_at: string | null
          id: string
          max_loss_percentage: number
          max_profit_percentage: number
          min_profit_percentage: number
          updated_at: string | null
          user_id: string
          win_probability: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_loss_percentage?: number
          max_profit_percentage?: number
          min_profit_percentage?: number
          updated_at?: string | null
          user_id: string
          win_probability?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          max_loss_percentage?: number
          max_profit_percentage?: number
          min_profit_percentage?: number
          updated_at?: string | null
          user_id?: string
          win_probability?: number
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          account_id: number
          balance: number | null
          created_at: string
          id: string
          profit: number | null
          role: string | null
        }
        Insert: {
          account_id?: number
          balance?: number | null
          created_at?: string
          id: string
          profit?: number | null
          role?: string | null
        }
        Update: {
          account_id?: number
          balance?: number | null
          created_at?: string
          id?: string
          profit?: number | null
          role?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          neuron_level: string | null
          neuron_level_percentage: number | null
          total_deposit_amount: number | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          neuron_level?: string | null
          neuron_level_percentage?: number | null
          total_deposit_amount?: number | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          neuron_level?: string | null
          neuron_level_percentage?: number | null
          total_deposit_amount?: number | null
        }
        Relationships: []
      }
      user_security_settings: {
        Row: {
          created_at: string
          id: string
          two_factor_enabled: boolean | null
          updated_at: string
          withdrawal_password: string | null
        }
        Insert: {
          created_at?: string
          id: string
          two_factor_enabled?: boolean | null
          updated_at?: string
          withdrawal_password?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          two_factor_enabled?: boolean | null
          updated_at?: string
          withdrawal_password?: string | null
        }
        Relationships: []
      }
      user_verifications: {
        Row: {
          created_at: string
          date_of_birth: string | null
          id: string
          id_back_url: string | null
          id_front_url: string | null
          id_type: string | null
          legal_name: string | null
          nationality: string | null
          residential_address: string | null
          status: Database["public"]["Enums"]["verification_status"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          id: string
          id_back_url?: string | null
          id_front_url?: string | null
          id_type?: string | null
          legal_name?: string | null
          nationality?: string | null
          residential_address?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          id_type?: string | null
          legal_name?: string | null
          nationality?: string | null
          residential_address?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      wallet_settings: {
        Row: {
          id: number
          updated_at: string
          wallet_address: string
        }
        Insert: {
          id?: number
          updated_at?: string
          wallet_address: string
        }
        Update: {
          id?: number
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string | null
          from_balance: number
          from_profit: number
          id: string
          status: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          from_balance?: number
          from_profit?: number
          id?: string
          status?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          from_balance?: number
          from_profit?: number
          id?: string
          status?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_trading_settings: {
        Args: { p_user_id: string }
        Returns: {
          win_probability: number
          max_profit_percentage: number
          max_loss_percentage: number
        }[]
      }
      process_withdrawal_approval: {
        Args: { withdrawal_id: string }
        Returns: Json
      }
    }
    Enums: {
      verification_status: "not_verified" | "pending" | "verified"
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
    Enums: {
      verification_status: ["not_verified", "pending", "verified"],
    },
  },
} as const
