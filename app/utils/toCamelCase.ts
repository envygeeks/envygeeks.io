// noinspection JSUnusedGlobalSymbols

export function toCamelCase(str: string): string {
  return str
    // Other letters
    .replace(/[-_]+(.)/g, (_, char) => {
      return char.toUpperCase();
    })
    // First letter
    .replace(/^(.)/, (_, char) => {
      return char.toLowerCase();
    });
}