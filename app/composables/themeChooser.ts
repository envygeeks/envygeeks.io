import { ref } from 'vue';

export const LIGHT_THEME = 'eg-light'; // Light Theme
export const DEFAULT_THEME = LIGHT_THEME; // Default Theme
export const DARK_THEME = 'eg-dark'; // Dark Theme

export const currentTheme = ref<string | null>(null);
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
  currentTheme.value = currentTheme.value === DARK_THEME ? LIGHT_THEME : DARK_THEME;
  document.documentElement.setAttribute('data-theme', currentTheme.value);
  localStorage.setItem(
    'theme', currentTheme.value,
  );
}
