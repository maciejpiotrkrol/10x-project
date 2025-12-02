export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      personal_records: {
        Row: {
          created_at: string;
          distance: Database["public"]["Enums"]["distance_type"];
          id: string;
          time_seconds: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          distance: Database["public"]["Enums"]["distance_type"];
          id?: string;
          time_seconds: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          distance?: Database["public"]["Enums"]["distance_type"];
          id?: string;
          time_seconds?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          age: number;
          created_at: string;
          gender: Database["public"]["Enums"]["gender_type"];
          goal_distance: Database["public"]["Enums"]["distance_type"];
          height: number;
          training_days_per_week: number;
          updated_at: string;
          user_id: string;
          weekly_km: number;
          weight: number;
        };
        Insert: {
          age: number;
          created_at?: string;
          gender: Database["public"]["Enums"]["gender_type"];
          goal_distance: Database["public"]["Enums"]["distance_type"];
          height: number;
          training_days_per_week: number;
          updated_at?: string;
          user_id: string;
          weekly_km: number;
          weight: number;
        };
        Update: {
          age?: number;
          created_at?: string;
          gender?: Database["public"]["Enums"]["gender_type"];
          goal_distance?: Database["public"]["Enums"]["distance_type"];
          height?: number;
          training_days_per_week?: number;
          updated_at?: string;
          user_id?: string;
          weekly_km?: number;
          weight?: number;
        };
        Relationships: [];
      };
      training_plans: {
        Row: {
          created_at: string;
          end_date: string;
          generated_at: string;
          id: string;
          is_active: boolean;
          metadata: Json | null;
          start_date: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          end_date: string;
          generated_at?: string;
          id?: string;
          is_active?: boolean;
          metadata?: Json | null;
          start_date: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          end_date?: string;
          generated_at?: string;
          id?: string;
          is_active?: boolean;
          metadata?: Json | null;
          start_date?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      workout_days: {
        Row: {
          completed_at: string | null;
          date: string;
          day_number: number;
          id: string;
          is_completed: boolean;
          is_rest_day: boolean;
          training_plan_id: string;
          workout_description: string;
        };
        Insert: {
          completed_at?: string | null;
          date: string;
          day_number: number;
          id?: string;
          is_completed?: boolean;
          is_rest_day?: boolean;
          training_plan_id: string;
          workout_description: string;
        };
        Update: {
          completed_at?: string | null;
          date?: string;
          day_number?: number;
          id?: string;
          is_completed?: boolean;
          is_rest_day?: boolean;
          training_plan_id?: string;
          workout_description?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_days_training_plan_id_fkey";
            columns: ["training_plan_id"];
            isOneToOne: false;
            referencedRelation: "training_plans";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      distance_type: "5K" | "10K" | "Half Marathon" | "Marathon";
      gender_type: "M" | "F";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      distance_type: ["5K", "10K", "Half Marathon", "Marathon"],
      gender_type: ["M", "F"],
    },
  },
} as const;
