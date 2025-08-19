import { z } from "zod";

// Base schemas for common fields using Zod v4 patterns
export const usernameSchema = z
  .string()
  .min(3, { error: "Username must be at least 3 characters" })
  .max(20, { error: "Username must be no more than 20 characters" })
  .regex(/^[a-zA-Z0-9_-]+$/, { error: "Username can only contain letters, numbers, hyphens, and underscores" })
  .refine((val) => !val.includes(' '), { error: "Username cannot contain spaces" });

export const passwordSchema = z
  .string()
  .min(6, { error: "Password must be at least 6 characters" })
  .regex(/(?=.*[a-z])/, { error: "Password must contain at least one lowercase letter" })
  .regex(/(?=.*[A-Z])/, { error: "Password must contain at least one uppercase letter" })
  .regex(/(?=.*\d)/, { error: "Password must contain at least one number" });

export const emailSchema = z
  .string()
  .email({ error: "Must be a valid email address" })
  .max(100, { error: "Email must be no more than 100 characters" });

export const phoneSchema = z
  .string()
  .max(20, { error: "Phone number must be no more than 20 characters" })
  .regex(/^[\+]?[1-9][\d]{0,15}$/, { error: "Must be a valid phone number" })
  .optional()
  .or(z.literal(""));

export const nameSchema = z
  .string()
  .min(2, { error: "Name must be at least 2 characters" })
  .max(50, { error: "Name must be no more than 50 characters" });

export const businessNameSchema = z
  .string()
  .max(100, { error: "Business name must be no more than 100 characters" })
  .optional()
  .or(z.literal(""));

export const addressSchema = z
  .string()
  .max(200, { error: "Address must be no more than 200 characters" })
  .optional()
  .or(z.literal(""));

export const referralCodeSchema = z
  .string()
  .max(20, { error: "Referral code must be no more than 20 characters" })
  .regex(/^[A-Z0-9]*$/, { error: "Referral code must be uppercase letters and numbers only" })
  .optional()
  .or(z.literal(""));

// Form schemas
export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, { error: "Password is required" }),
});

export const signupSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, { error: "Please confirm your password" }),
  name: nameSchema,
  businessName: businessNameSchema,
  address: addressSchema,
  email: emailSchema,
  phone: phoneSchema,
  referralCode: referralCodeSchema,
}).refine((data) => data.password === data.confirmPassword, {
  error: "Passwords don't match",
  path: ["confirmPassword"],
});

export const contractorSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: z.string().min(1, { error: "Password is required" }),
});

export const contractorEditSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: z.string().optional(), // Optional for editing
});

export const clientSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, { error: "Please confirm your password" }),
  name: nameSchema,
  businessName: businessNameSchema,
  address: addressSchema,
  email: emailSchema,
  phone: phoneSchema,
  referralCode: referralCodeSchema,
}).refine((data) => data.password === data.confirmPassword, {
  error: "Passwords don't match",
  path: ["confirmPassword"],
});

export const lawFirmSchema = z.object({
  firmName: nameSchema,
  referralCode: referralCodeSchema.refine(
    (val) => val && val.length > 0,
    { error: "Referral code is required" }
  ),
});

export const caseDetailsSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETE", "CANCELLED"]),
  paymentStatus: z.enum(["PENDING", "PAID", "OVERDUE"]),
  trialDate: z.string().optional(),
  districtCourtCaseNumber: z.string().max(100, { error: "Case number must be no more than 100 characters" }).optional(),
  contractorId: z.string().optional(),
  courtOutcomeNotes: z.string().max(500, { error: "Notes must be no more than 500 characters" }).optional(),
});

export const paymentAmendmentSchema = z.object({
  paymentAmount: z.number().min(0.01, { error: "Payment amount must be greater than 0" }),
  paymentDate: z.string().min(1, { error: "Payment date is required" }),
  paymentNotes: z.string().max(200, { error: "Notes must be no more than 200 characters" }).optional(),
});

export const propertySchema = z.object({
  propertyType: z.enum(["RESIDENTIAL", "COMMERCIAL"]),
  address: z.string().min(1, { error: "Address is required" }).max(200, { error: "Address must be no more than 200 characters" }),
  unit: z.string().max(50, { error: "Unit must be no more than 50 characters" }).optional().or(z.literal("")),
  county: z.string().min(1, { error: "County is required" }),
  city: z.string().min(1, { error: "City is required" }).max(100, { error: "City must be no more than 100 characters" }),
  zipCode: z.string().length(5, { error: "Zip code must be exactly 5 digits" }).regex(/^\d{5}$/, { error: "Zip code must contain only numbers" }),
  description: z.string().min(1, { error: "Description is required" }).max(500, { error: "Description must be no more than 500 characters" }),
});

export const tenantSchema = z.object({
  tenantNames: z.array(z.string().min(1, { error: "Tenant name is required" })).min(1, { error: "At least one tenant name is required" }),
  email: z.string().email({ error: "Must be a valid email address" }).optional().or(z.literal("")),
  phone: z.string().max(20, { error: "Phone number must be no more than 20 characters" }).optional().or(z.literal("")),
});

export const propertyFormSchema = z.object({
  property: propertySchema,
  tenant: tenantSchema.optional(),
});

export const accountEditSchema = z.object({
  name: nameSchema,
  businessName: businessNameSchema,
  address: addressSchema,
  email: emailSchema,
  phone: phoneSchema,
});

export const passwordChangeSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, { error: "Please confirm your password" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  error: "Passwords don't match",
  path: ["confirmPassword"],
});

export const accountEditFormSchema = z.object({
  profile: accountEditSchema,
  password: passwordChangeSchema.optional(),
});

// Types inferred from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ContractorFormData = z.infer<typeof contractorSchema>;
export type ContractorEditFormData = z.infer<typeof contractorEditSchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
export type LawFirmFormData = z.infer<typeof lawFirmSchema>;
export type CaseDetailsFormData = z.infer<typeof caseDetailsSchema>;
export type PaymentAmendmentFormData = z.infer<typeof paymentAmendmentSchema>;
export type PropertyFormData = z.infer<typeof propertyFormSchema>;
export type PropertyData = z.infer<typeof propertySchema>;
export type TenantData = z.infer<typeof tenantSchema>;
export type AccountEditFormData = z.infer<typeof accountEditFormSchema>;
export type AccountEditData = z.infer<typeof accountEditSchema>;
export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;

// FTPR Form Schema
export const ftprFormSchema = z.object({
  tenantId: z.string().min(1, { error: "Tenant selection is required" }),
  propertyId: z.string().min(1, { error: "Property selection is required" }),
  noRightOfRedemption: z.boolean(),
  rentOwed: z.number().min(0.01, { error: "Amount must be greater than 0" }).optional(),
  districtCourtCaseNumber: z.string().min(1, { error: "District Court Case Number is required" }),
  warrantOrderDate: z.string().min(1, { error: "Warrant order date is required" }),
  initialEvictionDate: z.string().min(1, { error: "Initial eviction date is required" }),
  landlordSignature: z.string().min(1, { error: "Landlord signature is required" }),
  thirtyDayNoticeFile: z.any().optional(), // File object
}).refine((data) => {
  // If no right of redemption, rent owed is not required
  if (data.noRightOfRedemption) {
    return true;
  }
  // If right of redemption exists, rent owed is required
  return data.rentOwed !== undefined && data.rentOwed > 0;
}, {
  error: "Amount Due to Redeem the Property is required when tenant can pay to stay",
  path: ["rentOwed"],
}).refine((data) => {
  // Validate eviction date is at least 17 days from today
  if (!data.initialEvictionDate) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const evictionDate = new Date(data.initialEvictionDate + "T00:00:00");
  const diffTime = evictionDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 17;
}, {
  error: "Initial Scheduled Date of Eviction must be at least 17 days from today",
  path: ["initialEvictionDate"],
});

export type FTPRFormData = z.infer<typeof ftprFormSchema>;
