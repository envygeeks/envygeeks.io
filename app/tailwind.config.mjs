// noinspection NpmUsedModulesInstalled
import { themes } from './theme.config.mjs';
import tailwindConfig from 'tailwindcss/defaultTheme';
import daisyui from 'daisyui';

const { sans, serif } = tailwindConfig.fontFamily;
export default {
  quiet: true,
  exposeConfig: false,
  plugins: [
    daisyui,
  ],
  content: [
    './components/**/*.vue',
    './pages/**/*.vue'
  ],
  safelist: [
    { pattern: /^w-[0-9]+$/ },
    { pattern: /^float-(left|right)$/ },
    { pattern: /^mask-[a-z]+$/ },
    'mask',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Poppins',
          ...sans,
        ],
        serif: [
          'Lora',
          ...serif,
        ],
      },
    },
  },
  daisyui: {
    themes: themes,
    logs: false,
  },
}