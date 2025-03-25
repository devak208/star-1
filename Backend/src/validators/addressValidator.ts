import { z } from 'zod';

export const createAddressSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
    isDefault: z.boolean().optional()
  })
});

export const updateAddressSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, 'Full name is required').optional(),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
    address: z.string().min(1, 'Address is required').optional(),
    city: z.string().min(1, 'City is required').optional(),
    state: z.string().min(1, 'State is required').optional(),
    zipCode: z.string().min(1, 'ZIP code is required').optional(),
    country: z.string().min(1, 'Country is required').optional(),
    isDefault: z.boolean().optional()
  }),
  params: z.object({
    id: z.string().uuid('Invalid address ID')
  })
}); 