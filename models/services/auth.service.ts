import { AuthError, SupabaseClient } from "@supabase/supabase-js";
import { AuthResponse, SignUpData } from "../types/auth.types";
import { createClient } from "../../lib/supabase/client";


export function createAuthService(supabase: SupabaseClient) {
  return {
    async getCurrentUserEmail(): Promise<string | null> {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        return data.user?.email || null;
      } catch (error) {
        console.error("Error fetching user email:", error);
        return null;
      }
    },

    async getCurrentUsername(): Promise<string | null> {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        return data.user?.user_metadata?.username || null;
      } catch (error) {
        console.error("Error fetching username:", error);
        return null;
      }
    },

    async getCurrentUserId(): Promise<string | null> {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        return session.user?.id || null;
      } catch (error) {
        console.log("Error fetching user ID:", error);
        return null;
      }
    },

    async signUp(data: SignUpData): Promise<AuthResponse> {
      try {
        const role = data.role === "analyst" ? "analyst" : "user";
        const fullName = [data.firstName, data.lastName]
          .filter((part): part is string => Boolean(part && part.trim()))
          .join(" ")
          .trim();

        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              first_name: data.firstName,
              last_name: data.lastName,
              full_name: fullName || undefined,
              display_name: fullName || undefined,
              role,
            },
          },
        });
        if (error) throw error;
        return { user: authData.user };
      } catch (error) {
        console.error("Signup failed:", error);
        return { user: null, error: (error as AuthError).message };
      }
    },

    async login(email: string, password: string): Promise<AuthResponse> {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return { user: data.user };
      } catch (error) {
        console.error("Login failed:", error);
        return { user: null, error: (error as AuthError).message };
      }
    },

    async logout(): Promise<{ success: boolean; error?: string }> {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error("Logout failed:", error);
        return { success: false, error: (error as AuthError).message };
      }
    }
  };
}

export class AuthService {
  
  static async signIn(
    email: string,
    password: string
  ): Promise<{ user: { id: string; email: string | undefined }; roles: string[] }> {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Authentication failed. No user returned.");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      throw new Error("User profile not found. Contact your administrator.");
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      throw new Error("Your account has been deactivated.");
    }

    return {
      user: { id: data.user.id, email: data.user.email },
      roles: [profile.role as string],
    };
  }

  
  static async signUp(data: SignUpData): Promise<AuthResponse> {
    const supabase = createClient();
    const role = data.role === "analyst" ? "analyst" : "user";
    const fullName = [data.firstName, data.lastName]
      .filter((part): part is string => Boolean(part && part.trim()))
      .join(" ")
      .trim();

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          full_name: fullName || undefined,
          display_name: fullName || undefined,
          role,
        },
      },
    });
    if (error) throw new Error(error.message);
    return { user: authData.user };
  }

  
  static async signOut(): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  
  static async getUserRoles(userId: string): Promise<string[]> {
    const supabase = createClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !profile) return [];
    return [profile.role as string];
  }

  
  static async getUserProfile(userId: string): Promise<{
    full_name: string | null;
    role: string;
    is_active: boolean;
  } | null> {
    const supabase = createClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("full_name, role, is_active")
      .eq("id", userId)
      .single();

    if (error || !profile) return null;
    return profile as { full_name: string | null; role: string; is_active: boolean };
  }
}

