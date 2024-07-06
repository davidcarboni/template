/**
 * @returns The specified environment variable if set, otherwise throws an exception. Ensures vissing variables are detected in testing.
 */
export function env(name: string): string {
  const result = process.env[name];
  if (!result) throw new Error(`Missing environment variable: ${name}`);
  return result;
}
