import { themes } from '../theme.config.mjs';
import { ref } from 'vue';

export const DarkTheme = 'dark'; // Dark Theme
export const currentTheme = ref<string | null>(null); // Current Theme
export const DefaultTheme = DarkTheme; // Default Theme
export const LightTheme = 'light'; // Light Theme

export type theme = {
  [key: string]: {
    [key: string]: string
  }
}

export function getTheme(themeName: string) {
  return (themes as unknown as theme[]).find(
    theme => Object.keys(theme).includes(
      themeName,
    ),
  )?.[themeName];
}

export function initTheme() {
  currentTheme.value = localStorage.getItem('theme') ||
    document.documentElement.getAttribute(
      'data-theme',
    );
}

/**
 * Toggles the application theme between
 * light and dark mode.
 *
 * This method updates the `currentTheme`
 * value based on the `isDark` boolean value.
 * It also modifies the `data-theme` attribute of
 * the HTML document root element and persists
 * the selected theme to local storage.
 */
export function toggleTheme() {
  currentTheme.value = currentTheme.value === DarkTheme ? LightTheme : DarkTheme;
  document.documentElement.setAttribute('data-theme', currentTheme.value);
  localStorage.setItem(
    'theme', currentTheme.value,
  );
}