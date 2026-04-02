import { z } from "zod";

export const profileSchema = z.object({
    id: z.string().uuid(),
    full_name: z.string().optional(),
    role: z.enum(['user', 'analyst', 'admin']).default('user'),
    is_active: z.boolean().default(true),
    created_at: z.coerce.date().optional()
});

export type Profile = z.infer<typeof profileSchema>;