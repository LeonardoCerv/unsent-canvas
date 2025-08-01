import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client with anonymous access (no authentication required)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string;
          created_at: string;
          sent_to: string;
          message: string;
          x: number;
          y: number;
          color: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          sent_to: string;
          message: string;
          x: number;
          y: number;
          color?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          sent_to?: string;
          message?: string;
          x?: number;
          y?: number;
          color?: string;
        };
      };
    };
  };
};
