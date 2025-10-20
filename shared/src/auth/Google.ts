import { z } from 'zod';

/**
 * Based on the User type from @react-native-google-signin/google-signin/src/types.ts
 */
export const GoogleCredentialSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    photo: z.string().nullable(),
    familyName: z.string().nullable(),
    givenName: z.string().nullable(),
  }),
  scopes: z.array(z.string()),
  /**
   * JWT (JSON Web Token) that serves as a secure credential for your user's identity.
   */
  idToken: z.string().nullable(),
  /**
   * Not null only if a valid webClientId and offlineAccess: true was
   * specified in configure().
   */
  serverAuthCode: z.string().nullable(),
});
export type GoogleCredential = z.infer<typeof GoogleCredentialSchema>;

export const GoogleJwtSchema = z.object({
  iss: z.literal('https://accounts.google.com'),
  azp: z.string(), // 939418582800-cqohfd4pk5pg8s19eae0sfhqgpfndv42.apps.googleusercontent.com,
  aud: z.string(), // 939418582800-o2sfi17ncho8e6g477v9elltja7hpjud.apps.googleusercontent.com,
  sub: z.string(), // 106454735960141906434,
  hd: z.string().optional(), // carboni.co,
  email: z.email(), // david@carboni.co,
  email_verified: z.boolean(), // true,
  name: z.string().optional(), // David Carboni,
  picture: z.url().optional(), // https://lh3.googleusercontent.com/a/ACg8ocLg53mw6k4ik6zLSixKk8FolI5KQUdRQ18FwPJqeonOjmpw=s96-c,
  given_name: z.string(), // David,
  family_name: z.string(), // Carboni,
  locale: z.string().optional(), // en-GB,
  iat: z.number(), // 1695658890,
  exp: z.number(), // 1695662490,
});
export type GoogleJwt = z.infer<typeof GoogleJwtSchema>;
