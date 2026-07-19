/**
 * Read a required environment variable.
 * @param {string} name The environment variable name.
 * @returns {string} The variable's value.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable not found: ${name}`);
  }

  return value;
}
