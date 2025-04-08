// noinspection JSUnusedGlobalSymbols

import tailwindcss from '@tailwindcss/vite';
import type { ConfigLayerMeta } from 'c12';
import { DEFAULT_THEME } from './composables/themeChooser';
import { resolve } from 'path';

/**
 * Webstorm and Nuxt currently
 * do not recognize the recently added
 * $<env> that Nuxt supports with
 * --envName, which we heavily
 * use to alter envs!
 */
declare module '@nuxt/schema' {
  interface NuxtConfig {
    $prod?: Record<string, ConfigLayerMeta>;
    $local?: Record<string, ConfigLayerMeta>;
    $dev?: Record<string, ConfigLayerMeta>;
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2024-10-12',
  components: true,
  nitro: {
    preset: 'aws-lambda',
    compressPublicAssets: true,
    minify: true,
  },
  app: {
    head: {
      titleTemplate: '%s',
      link: [
        {
          type: 'image/x-icon',
          href: '/favicon.ico',
          rel: 'icon',
        },
        {
          href: '/favicon.png',
          rel: 'shortcut icon',
        },
        {
          href: '/apple-touch-icon.png',
          rel: 'apple-touch-icon',
        },
      ],
      htmlAttrs: {
        'data-theme': DEFAULT_THEME,
        lang: 'en',
      },
      script: [
        {
          type: 'text/javascript',
          innerHTML: `
            (() => {
              const theme = localStorage.getItem('theme') || '${DEFAULT_THEME}';
              document.documentElement.setAttribute('data-theme', theme);
            })();
          `,
        },
      ],
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
      // {
      //   apply: 'build',
      //   name: 'vite-plugin-ignore-sourcemap-warnings',
      //   configResolved(config) {
      //     const originalOnWarn = config.build.rollupOptions.onwarn;
      //     config.build.rollupOptions.onwarn = (warning, warn) => {
      //       if (
      //         warning.code === 'SOURCEMAP_BROKEN' &&
      //         warning.plugin === '@tailwindcss/vite:generate:build'
      //       ) {
      //         return;
      //       }
      //
      //       if (originalOnWarn) {
      //         originalOnWarn(
      //           warning, warn,
      //         );
      //       } else {
      //         warn(
      //           warning,
      //         );
      //       }
      //     };
      //   },
      // },
    ],
    build: {
      cssCodeSplit: true,
    },
  },
  css: ['~/assets/css/main.css'],
  modules: [
    '@nuxt/image',
    '@nuxt/content',
    '@nuxtjs/google-fonts',
    '@nuxt/eslint',
    '@nuxtjs/seo',
    'dayjs-nuxt',
  ],
  image: {
    quality: 80,
    format: [
      'webp', 'avif',
    ],
  },
  content: {
    navigation: {
      fields: ['icon'],
    },
    sources: {
      content: {
        driver: 'fs',
        base: resolve(
          __dirname,
          '_disabled',
        ),
      },
      data: {
        prefix: '/data',
        driver: 'fs',
        base: resolve(
          __dirname,
          'content/data',
        ),
      },
      authors: {
        prefix: '/authors',
        driver: 'fs',
        base: resolve(
          __dirname,
          'content/data/authors',
        ),
      },
      blog: {
        prefix: '/blog',
        driver: 'fs',
        base: resolve(
          __dirname,
          'content/posts',
        ),
      },
      snippets: {
        prefix: '/snippets',
        driver: 'fs',
        base: resolve(
          __dirname,
          'content/snippets',
        ),
      },
      pages: {
        prefix: '/',
        driver: 'fs',
        base: resolve(
          __dirname,
          'content/pages',
        ),
      },
    },
    highlight: {
      theme: {
        light: 'github-light',
        default: 'synthwave-84',
        dark: 'synthwave-84',
      },
      langs: [
        'ruby', 'python',
        'javascript', 'csharp', 'sql',
        'liquid', 'shell',
        'scss', 'ts',
      ],
    },
  },
  dayjs: {
    locales: ['en'],
    defaultTimezone: 'America/Chicago',
    defaultLocale: 'en',
    plugins: [
      'timezone',
      'relativeTime',
      'utc',
    ],
  },
  experimental: {
    payloadExtraction: true,
  },
  googleFonts: {
    display: 'swap',
    families: {
      'Poppins': {
        wght: [300, 400, 700],
        ital: [300, 400, 700],
      },
      'Lora': {
        wght: [300, 400, 700],
        ital: [300, 400, 700],
      },
    },
  },
  appConfig: {
    title: {
      main: 'Jordon Bedwell',
      sub: 'EnvyGeeks',
    },
  },
  seo: {
    meta: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      description: 'The website of Jordon Bedwell, a devops engineer',
      twitterCard: 'summary_large_image',
      ogSiteName: 'Jordon Bedwell',
      ogType: 'website',
    },
  },
  hooks: {
    'pages:extend'(pages) {
      pages.push({
        name: 'snippet',
        path: '/snippets/:slug*',
        file: resolve(
          __dirname,
          'pages/snippets.vue',
        ),
      });
    },
  },
  $local: {
    nitro: {
      sourceMap: true,
    },
    vite: {
      css: {
        devSourcemap: true,
      },
    },
    image: {
      dir: 'public/assets/images',
      providers: {
        ipx: {
          name: 'ipx',
          provider: 'ipx',
        },
      },
    },
    devtools: {
      enabled: true,
      timeline: {
        enabled: true,
      },
    },
    build: {
      analyze: true,
    },
  },
  $dev: {
    nitro: {
      dev: false,
      output: {
        dir: process.env.NUXT_OUTPUT_DIR ?? '.output',
      },
    },
    image: {
      provider: 'imgix',
      imgix: {
        baseURL: '/assets',
      },
      providers: {
        s3: {
          provider: '~/providers/s3',
          options: {},
        },
      },
      quality: 80,
      format: [
        'webp', 'avif',
      ],
    },
  },
});
