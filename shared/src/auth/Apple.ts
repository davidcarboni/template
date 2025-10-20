import { z } from "zod";

export const AppleCredentialSchema = z.object({
  authorizationCode: z.string().nullable(),
  email: z.string().nullable(),
  fullName: z.object({
    familyName: z.string().nullable(),
    givenName: z.string().nullable(),
    middleName: z.string().nullable(),
    namePrefix: z.string().nullable(),
    nameSuffix: z.string().nullable(),
    nickname: z.string().nullable(),
  }).nullable(),
  identityToken: z.string().nullable(), // <jwt>,
  realUserStatus: z.number(), // 1,
  state: z.string().nullable(), // <Hairtracker state value> - handled in the app
  user: z.string(), // <Apple user ID>
});
export type AppleCredential = z.infer<typeof AppleCredentialSchema>;

export const AppleJwtSchema = z.object({
  iss: z.literal('https://appleid.apple.com'),
  aud: z.string(), // 'host.exp.Exponent'
  exp: z.number(), // 1690669894
  iat: z.number(), // 1690583494
  sub: z.string(), // '000285.2c66f3b7af154a86928c4f8921f13738.2156'
  nonce: z.string(), // '...'
  c_hash: z.string(), // 'YJ-IMsH9gf4YVwG_TPxi_A'
  email: z.string(), // 'david.carboni@downloadcreations.com'
  email_verified: z.boolean(), // 'true'
  auth_time: z.number(), // 1690583494
  nonce_supported: z.boolean(), // true
});
export type AppleJwt = z.infer<typeof AppleJwtSchema>;