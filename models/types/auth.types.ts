import { User } from "@supabase/supabase-js";

export interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'user' | 'analyst';
}

export interface AuthResponse {
  user: User | null;
  error?: string;
}