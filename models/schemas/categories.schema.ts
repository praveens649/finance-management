import { z } from "zod";

// Define the valid enum for category types
export const CategoryTypeEnum = z.enum(["income", "expense"]);

/**
 * Base Category Schema
 * Represents the complete category object as returned by the database.
 */
export const categorySchema = z.object({
  // Note: z.string().uuid() is the standard Zod way to validate UUIDs
  id: z.string().uuid("Invalid category ID format"),
  user_id: z.string().uuid("Invalid user ID format"),
  
  name: z.string().min(1, "Category name is required").max(100, "Category name is too long"),
  type: CategoryTypeEnum,
  
  created_at: z.coerce.date(),
});

export type Category = z.infer<typeof categorySchema>;

/**
 * Schema for Creating a Category from the UI
 * We omit system-generated fields (id, user_id, created_at)
 */
export const createCategorySchema = categorySchema.pick({
  name: true,
  type: true,
});

export type CreateCategoryPayload = z.infer<typeof createCategorySchema>;

/**
 * Schema for Updating a Category
 */
export const updateCategorySchema = createCategorySchema.partial();

export type UpdateCategoryPayload = z.infer<typeof updateCategorySchema>;

// Your SQL schema block for reference:
/*
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,

  name text not null,
  type text not null, -- income / expense

  created_at timestamp default now()
);
*/