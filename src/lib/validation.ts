import { z } from 'zod';
export const uuid = z.uuid();
export const productInput = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100), name: z.string().trim().min(2).max(120),
  description: z.string().max(5000).default(''), category_id: z.uuid().nullable().optional(),
  base_price_minor: z.number().int().min(0), material: z.string().max(100).nullable().optional(),
  frame_shape: z.string().max(100).nullable().optional(), fit: z.string().max(100).nullable().optional(),
  status: z.enum(['draft','published','archived']).default('draft'), featured_order: z.number().int().nullable().optional(),
});
export const variantInput = z.object({ product_id: z.uuid(), sku: z.string().trim().min(2).max(80), frame_color: z.string().trim().min(1).max(80), lens_color: z.string().trim().min(1).max(80), price_minor: z.number().int().min(0), stock_quantity: z.number().int().min(0), active: z.boolean().default(true) });
export const addressInput = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().regex(/^[0-9+() -]{8,20}$/), line_1: z.string().trim().min(3).max(180), line_2: z.string().max(180).optional(), city: z.string().trim().min(2).max(100), state: z.string().trim().min(2).max(100), postal_code: z.string().regex(/^\d{6}$/), country: z.literal('IN') });
export const contactInput = z.object({ sender_name: z.string().trim().min(2).max(120), email: z.email(), subject: z.string().trim().min(3).max(120), body: z.string().trim().min(10).max(3000) });
