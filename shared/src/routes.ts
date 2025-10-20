import z from "zod";
import { GoogleCredentialSchema } from "./auth/Google";
import { UserSchema } from "./types/User";
import { AppleCredentialSchema } from "./auth/Apple";

interface Methods {
  GET?: {
    pathParameters?: z.ZodTypeAny;
    query?: z.ZodTypeAny;
    response: z.ZodTypeAny;
  },
  POST?: {
    request: z.ZodTypeAny;
    response: z.ZodTypeAny;
  },
  OPTIONS?: {
    response: z.ZodTypeAny;
  },
}

export const paths = {
  '/ping': {
    GET: {
      response: z.object({ message: z.literal(['pong']) })
    }
  } satisfies Methods,

  // Sign in with Apple:
  '/auth/apple': {
    POST: {
      request: z.object({
        credential: AppleCredentialSchema,
        nonce: z.string(),
      }),
      response: UserSchema,
    }
  } satisfies Methods,

  // Sign in with Google:
  '/auth/google': {
    POST: {
      request: z.object({
        credential: GoogleCredentialSchema,
      }),
      response: UserSchema,
    }
  } satisfies Methods,

  // User

  '/user': {
    GET: {
      response: UserSchema,
    },
  } satisfies Methods,

  '/user/privacy-policy': {
    POST: {
      request: z.object({
        // If no date is sent, the privacy policy will be un-accepted
        acceptedDate: z.coerce.date().optional(),
      }),
      response: UserSchema,
    }
  } satisfies Methods,
};

// Types
export type Paths = keyof typeof paths;
