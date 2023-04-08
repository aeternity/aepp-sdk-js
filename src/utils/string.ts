/**
 * Convert string from snake_case to PascalCase
 * @param s - String to convert
 * @returns Converted string
 */
export function snakeToPascal(s: string): string {
  return s.replace(/_./g, (match) => match[1].toUpperCase());
}

/**
 * Convert string from PascalCase to snake_case
 * @param s - String to convert
 * @returns Converted string
 */
export function pascalToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}
