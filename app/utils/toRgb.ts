import { parse, formatHex } from 'culori';

export function toRgb(color: string) {
  if (color.startsWith('rgb') || color.startsWith('#')) return color;
  const parsedColor = parse(color);
  if (!parsedColor) {
    return color;
  }

  return formatHex(
    parsedColor,
  );
}