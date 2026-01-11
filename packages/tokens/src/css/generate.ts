export function generateCSSVariables(tokens: Record<string, string | number>): string {
  const variables = Object.entries(tokens)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n');
  return `:root {\n${variables}\n}`;
}
