<template>
  <div class="drawer drawer-end">
    <input id="sidebar-drawer" type="checkbox" class="drawer-toggle">
    <div class="layout drawer-content">
      <header class="header">
        <div class="title">
          <h1>
            <nuxt-link rel="me" :to="{ name: 'home' }">
              {{ sub }}
            </nuxt-link>
          </h1>
          <span>
            {{ main }}
          </span>
        </div>
        <div class="right">
          <nav-large />
          <div class="phone-hidden">
            <theme-chooser
              :size="5"
            />
          </div>

          <nav-button />
        </div>
      </header>

      <slot/>
    </div>

    <nav-small>
      <div class="p-4">
        <theme-chooser
          class="flex justify-end"
          :size="6"
        />
      </div>
    </nav-small>
  </div>
</template>

<script setup lang="ts">
  const route = useRoute();
  const {
    title: {
      main, sub,
    },
  } = useAppConfig();

  useHead({
    title: main,
    link: [
      {
        rel: 'alternate',
        hreflang: 'x-default',
        href: route.path,
      },
    ],
    htmlAttrs: {
      lang: 'en',
    },
  });
</script>

<style>
  @tailwind utilities;
  @tailwind components;
  @tailwind base;

  @font-face {
    font-family: 'Fast Sans';
    src: url('/assets/fonts/Fast_Sans.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
  }

  @layer utilities {
    .min-w-screen-md { min-width: theme('screens.md'); }
    .min-w-screen-lg { min-width: theme('screens.lg'); }
    .min-w-screen-sm { min-width: theme('screens.sm'); }
  }

  html, body {
    @apply min-h-screen;
  }

  body {
    @apply font-normal;
    @apply font-sans;
  }

  .phone-hidden {
    @apply hidden;
    @apply lg:flex;
  }

  .content {
    @apply min-w-[0px];
    @apply min-w-[120px];
    @apply leading-[32px];
    @apply max-w-[660px];
    @apply text-[18px];
    @apply w-full;

    > article {
      @apply mt-24;
    }

    h1, h2, h3, h4 {
      @apply font-sans;
      @apply font-extrabold;
      @apply tracking-tighter;
      @apply pb-8;
    }

    h1 { @apply text-5xl; }
    h2 { @apply text-4xl; }
    h3 { @apply text-3xl; }
    h4 { @apply text-2xl; }

    p {
      @apply mb-8;
    }

    pre[class*="language-"] {
      @apply border;
      @apply rounded-md;
      @apply border-base-300;
      @apply overflow-x-auto;
      @apply bg-base-200;
      @apply text-sm;
      @apply mb-8;
      @apply p-4;

      span {
        color: var(--shiki-default);
      }
    }
  }

  .layout {
    @apply flex;
    @apply flex-col;
    @apply items-center;
    @apply max-w-screen-md;
    @apply pb-24;

    @media (max-width: theme('screens.md')) { @apply px-6; }
    @media (min-width: theme('screens.md')) {
      @apply min-w-screen-md !important;
      @apply mx-auto;
    }
  }

  html[data-theme="dark"] {
    color-scheme: dark;

    .content {
      pre[class*="language-"] {
        background-color: color-mix(
          in oklch, oklch(var(--n)), black 12%
        );

        span {
          font-weight: var(--shiki-dark-font-weight);
          text-decoration: var(--shiki-dark-text-decoration);
          color: var(--shiki-dark);
        }
      }
    }
  }

  html[data-theme="light"] {
    color-scheme: light;

    .content {
      pre[class*="language-"] {
        @apply bg-opacity-40;

        span {
          font-weight: var(--shiki-light-font-weight);
          text-decoration: var(--shiki-light-text-decoration);
          color: var(--shiki-light);
        }
      }
    }
  }

  html[data-bionic] {
    body {
      font-family: 'Fast Sans', sans-serif;
    }
  }
</style>

<style scoped>
  .header {
    @apply flex;
    @apply w-full;
    @apply justify-between;
    @apply items-center;
    @apply py-6;

    h1, a {
      white-space: nowrap;
    }

    .title {
      grid-template-areas: "a b";
      @apply grid;

      h1 {
        grid-area: b;
        @apply italic;
        @apply text-lg;
        @apply font-serif;
        @apply items-center;
        @apply border-base-content;
        @apply place-self-center;
        @apply leading-none;
        @apply border-l;
        @apply h-full;
        @apply flex;
        @apply pl-4;
      }

      span {
        grid-area: a;
        @apply text-lg;
        @apply font-bold;
        @apply leading-none;
        @apply font-serif;
        @apply uppercase;
        @apply h-full;
        @apply pr-4;
      }
    }

    .right {
      @apply flex;
      @apply items-center;
      @apply space-x-6;
      @apply pl-6;
    }
  }
</style>