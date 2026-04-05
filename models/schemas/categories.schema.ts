import { z } from "zod";

export const CategoryTypeEnum = z.enum(["income", "expense"]);


export const categorySchema = z.object({
  id: z.string().uuid("Invalid category ID format"),
  user_id: z.string().uuid("Invalid user ID format"),
  
  name: z.string().min(1, "Category name is required").max(100, "Category name is too long"),
  type: CategoryTypeEnum,
  
  created_at: z.coerce.date(),
});

export type Category = z.infer<typeof categorySchema>;


export const createCategorySchema = categorySchema.pick({
  name: true,
  type: true,
});

export type CreateCategoryPayload = z.infer<typeof createCategorySchema>;


export const updateCategorySchema = createCategorySchema.partial();

export type UpdateCategoryPayload = z.infer<typeof updateCategorySchema>;


