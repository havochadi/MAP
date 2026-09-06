import { z } from "zod";
import { LEVELS } from "@/validations/student";

export const EMERGENCY_CONTACT_RELATIONSHIPS = ["MOTHER", "FATHER", "GUARDIAN", "OTHER"] as const;
export const REFERRAL_SOURCES = ["MAP_CLASS", "SOCIAL_MEDIA", "FRIENDS_FAMILY", "OTHER"] as const;

export const registerStudentSchema = z.object({
  name: z.string().min(2).max(100),
  level: z.enum(LEVELS),
  contactNumber: z.string().min(7).max(20),
  schoolName: z.string().min(2).max(150),
  email: z.email(),
  isMapStudent: z.enum(["true", "false"]).transform((v) => v === "true"),
  emergencyContactName: z.string().min(2).max(100),
  emergencyContactRelationship: z.enum(EMERGENCY_CONTACT_RELATIONSHIPS),
  emergencyContactPhone: z.string().min(7).max(20),
  referralSource: z.enum(REFERRAL_SOURCES).optional(),
});
