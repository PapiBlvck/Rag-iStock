import { z } from 'zod';

export const RoleSchema = z.enum(['Farmer', 'Vet']);

export const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SignUpSchema = SignInSchema.extend({
  role: RoleSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type Role = z.infer<typeof RoleSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;

