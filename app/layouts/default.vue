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
          <theme-chooser
            :size="5"
          />

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

<style scoped>
  @reference '~/assets/css/main.css';

  .layout {
    @apply flex;
    @apply flex-col;
    @apply items-center;
    @apply max-w-screen-md;
    @apply pb-24;

    @media (max-width: theme('screens.md')) { @apply px-6; }
    @media (min-width: theme('screens.md')) {
      @apply min-w-screen-md;
      @apply mx-auto;
    }
  }

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
