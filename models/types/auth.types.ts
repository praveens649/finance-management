import { User } from "@supabase/supabase-js";

export interface SignUpData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  error?: string;
}