import { z } from 'zod';

// Search query validation
export const searchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Query too long'),
});

// Product ID validation
export const productIdSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
});

// History entry validation
export const historyEntrySchema = z.object({
  query: z.string().min(1),
  productId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
});

// Product data schema (normalized)
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
  image: z.string(),
  nutriScore: z.string().nullable(),
  ecoScore: z.string().nullable(),
  additives: z.array(z.string()),
  nutrition: z.object({
    energy: z.number(),
    fat: z.number(),
    sugars: z.number(),
    salt: z.number(),
    protein: z.number(),
    saturatedFat: z.number().optional(),
    fiber: z.number().optional(),
    sodium: z.number().optional(),
  }),
  packaging: z.array(z.string()),
  carbonFootprint: z.number().nullable(),
  ingredients: z.string().optional(),
  categories: z.array(z.string()).optional(),
});

