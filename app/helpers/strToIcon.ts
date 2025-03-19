import { IconMap } from '~/constants/IconMap';

export function strToIcon(name: string): Component|null {
  if (!name || name === '' || typeof name === 'undefined') {
    return null;
  }
  else {
    if (name.startsWith('Icon')) {
      name = name.slice(4).toLowerCase();
    }
  }

  return IconMap[name];
}