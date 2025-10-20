import { z } from "zod";
import { UserIdSchema } from "./id";


export const UserSchema = z.object({

  // Database keys
  userId: UserIdSchema,
  email: z.email(),

  // Identity provider IDs
  appleId: z.string().optional(),
  googleId: z.string().optional(),

  // User details
  name: z.string(),
  familyName: z.string().optional(), // Not currently used but might be helpful for support purposes if first name isn't enough to identify someone
  profilePicture: z.string().optional(),

  // Dates   
  created: z.coerce.date(),
  updated: z.coerce.date().optional(),
  lastLogin: z.coerce.date().optional(),
  lastAccess: z.coerce.date().optional(),

  platform: z.enum(['ios', 'android']).optional(),
  nativeApplicationVersion: z.string().optional(),
  nativeBuildVersion: z.string().optional(),

  // Privacy policy
  privacyPolicyAccepted: z.coerce.date().optional(),
});

export type User = z.infer<typeof UserSchema>;
