export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      balance_summaries: {
        Row: {
          id: string;
          user_id: string;
          period_from: string;
          period_to: string;
          currency: "IDR";
          total_balance: number;
          monthly_income: number;
          monthly_expense: number;
          available_to_spend: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_from: string;
          period_to: string;
          currency?: "IDR";
          total_balance: number;
          monthly_income: number;
          monthly_expense: number;
          available_to_spend: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period_from?: string;
          period_to?: string;
          currency?: "IDR";
          total_balance?: number;
          monthly_income?: number;
          monthly_expense?: number;
          available_to_spend?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      action_shortcuts: {
        Row: {
          id: string;
          user_id: string;
          shortcut_id: Database["public"]["Enums"]["action_shortcut_id"];
          label: string;
          is_primary: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          shortcut_id: Database["public"]["Enums"]["action_shortcut_id"];
          label: string;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          shortcut_id?: Database["public"]["Enums"]["action_shortcut_id"];
          label?: string;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      weekly_trend_points: {
        Row: {
          id: string;
          user_id: string;
          period_from: string;
          period_to: string;
          label: string;
          income: number;
          expense: number;
          currency: "IDR";
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_from: string;
          period_to: string;
          label: string;
          income: number;
          expense: number;
          currency?: "IDR";
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period_from?: string;
          period_to?: string;
          label?: string;
          income?: number;
          expense?: number;
          currency?: "IDR";
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      spending_breakdown_items: {
        Row: {
          id: string;
          user_id: string;
          period_from: string;
          period_to: string;
          category: string;
          amount: number;
          percentage: number;
          color_hex: string;
          currency: "IDR";
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_from: string;
          period_to: string;
          category: string;
          amount: number;
          percentage: number;
          color_hex: string;
          currency?: "IDR";
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period_from?: string;
          period_to?: string;
          category?: string;
          amount?: number;
          percentage?: number;
          color_hex?: string;
          currency?: "IDR";
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      financial_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          deadline: string;
          saved: number;
          target: number;
          currency: "IDR";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          deadline: string;
          saved?: number;
          target: number;
          currency?: "IDR";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          deadline?: string;
          saved?: number;
          target?: number;
          currency?: "IDR";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      transactions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string;
          direction: Database["public"]["Enums"]["transaction_direction"];
          amount: number;
          currency: "IDR";
          occurred_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category: string;
          direction: Database["public"]["Enums"]["transaction_direction"];
          amount: number;
          currency?: "IDR";
          occurred_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: string;
          direction?: Database["public"]["Enums"]["transaction_direction"];
          amount?: number;
          currency?: "IDR";
          occurred_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      daily_transaction_limits: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          used: number;
          limit: number;
          currency: "IDR";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          used?: number;
          limit: number;
          currency?: "IDR";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          used?: number;
          limit?: number;
          currency?: "IDR";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      linked_accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          masked_number: string;
          balance: number;
          currency: "IDR";
          accent_color: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          masked_number: string;
          balance?: number;
          currency?: "IDR";
          accent_color?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          masked_number?: string;
          balance?: number;
          currency?: "IDR";
          accent_color?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      user_settings: {
        Row: {
          user_id: string;
          full_name: string;
          email: string;
          phone: string;
          role: string;
          currency: string;
          timezone: string;
          language: string;
          start_of_week: Database["public"]["Enums"]["start_of_week"];
          email_alerts: boolean;
          push_notifications: boolean;
          monthly_report: boolean;
          compact_mode: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          full_name: string;
          email: string;
          phone: string;
          role: string;
          currency?: string;
          timezone?: string;
          language?: string;
          start_of_week?: Database["public"]["Enums"]["start_of_week"];
          email_alerts?: boolean;
          push_notifications?: boolean;
          monthly_report?: boolean;
          compact_mode?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          role?: string;
          currency?: string;
          timezone?: string;
          language?: string;
          start_of_week?: Database["public"]["Enums"]["start_of_week"];
          email_alerts?: boolean;
          push_notifications?: boolean;
          monthly_report?: boolean;
          compact_mode?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      [_ in never]: never;
    };

    Enums: {
      transaction_direction: "income" | "expense" | "transfer";
      action_shortcut_id: "deposit" | "transfer";
      start_of_week: "Monday" | "Sunday";
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type PublicSchema = Database["public"];

export type Tables<
  T extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][T]["Row"];

export type Inserts<
  T extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][T]["Insert"];

export type Updates<
  T extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][T]["Update"];

export type Enums<
  T extends keyof PublicSchema["Enums"]
> = PublicSchema["Enums"][T];
