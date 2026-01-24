import { z } from 'zod'

// Industry options for AI insights tailoring
export const INDUSTRY_OPTIONS = [
  { value: 'real-estate-residential', label: 'Real Estate - Residential' },
  { value: 'real-estate-commercial', label: 'Real Estate - Commercial' },
  { value: 'solar', label: 'Solar Sales' },
  { value: 'insurance-life', label: 'Insurance - Life' },
  { value: 'insurance-health', label: 'Insurance - Health' },
  { value: 'insurance-auto-home', label: 'Insurance - Auto/Home' },
  { value: 'financial-services', label: 'Financial Services' },
  { value: 'home-services-hvac', label: 'Home Services - HVAC' },
  { value: 'home-services-roofing', label: 'Home Services - Roofing' },
  { value: 'home-services-windows', label: 'Home Services - Windows/Siding' },
  { value: 'b2b-services', label: 'B2B Services' },
  { value: 'other', label: 'Other (please specify)' },
] as const

export type IndustryValue = typeof INDUSTRY_OPTIONS[number]['value']

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

export const signupSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  company: z
    .string()
    .max(200, 'Company name must be less than 200 characters')
    .optional(),
  industry: z
    .string()
    .min(1, 'Please select your industry'),
  industryCustom: z
    .string()
    .max(100, 'Industry description must be less than 100 characters')
    .optional(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => {
  // If industry is 'other', require industryCustom
  if (data.industry === 'other') {
    return data.industryCustom && data.industryCustom.trim().length > 0
  }
  return true
}, {
  message: 'Please specify your industry',
  path: ['industryCustom'],
})

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>
