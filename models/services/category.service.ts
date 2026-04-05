import { SupabaseClient } from "@supabase/supabase-js";
import { Category, CreateCategoryPayload, createCategorySchema } from "../schemas/categories.schema";
import { requireActive, requireRole } from "./role.utils";
import { Profile } from "../schemas/profile.schema";

export function createCategoryService(supabase: SupabaseClient) {
  async function getAuthorizedUser() {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized access: Please log in.");
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

    if (!profile) {
      throw new Error("Profile not found.");
    }

    requireActive(profile as Profile);
    requireRole(profile as Profile, "user");

    return user;
  }

  return {
    async getUserCategories(): Promise<{ data: Category[] | null; error: string | null }> {
      try {
        const user = await getAuthorizedUser();

        const { data: categories, error } = await supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Fetch Categories Database Error:", error);
          return { data: null, error: "Failed to fetch categories." };
        }

        return { data: categories as Category[], error: null };
      } catch (err: unknown) {
        console.error("Service Layer Fetch Error:", err);
        const message = err instanceof Error ? err.message : "An unexpected error occurred while fetching categories.";
        return { data: null, error: message };
      }
    },

    async createCategory(payload: CreateCategoryPayload): Promise<{ data: Category | null; error: string | null }> {
      try {
        const validPayload = createCategorySchema.parse(payload);
        const user = await getAuthorizedUser();

        const { data: existingCategory } = await supabase
          .from("categories")
          .select("id")
          .eq("user_id", user.id)
          .eq("name", validPayload.name)
          .eq("type", validPayload.type)
          .maybeSingle();

        if (existingCategory) {
          return { data: null, error: "That category already exists." };
        }

        const { data: category, error } = await supabase
          .from("categories")
          .insert({
            user_id: user.id,
            name: validPayload.name,
            type: validPayload.type,
          })
          .select()
          .single();

        if (error || !category) {
          console.error("Create Category DB Error:", error);
          return { data: null, error: "Database rejected the category creation." };
        }

        return { data: category as Category, error: null };
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "ZodError") {
          return { data: null, error: `Validation failed: ${(err as any).issues?.[0]?.message ?? err.message}` };
        }

        console.error("Create Category Service Error:", err);
        const message = err instanceof Error ? err.message : "An unexpected error occurred while creating the category.";
        return { data: null, error: message };
      }
    },
  };
}