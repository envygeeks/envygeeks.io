<template>
  <div class="drawer-side">
    <label for="sidebar-drawer" aria-label="close sidebar" class="drawer-overlay"/>
    <div class="drawer-inner">
      <header>
        <h2>Navigation</h2>
        <label for="sidebar-drawer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              d="M6 18L18 6M6 6l12 12"
              stroke-linejoin="round"
              stroke-width="2"
            />
          </svg>
        </label>
      </header>

      <ul class="menu">
        <li>
          <icon-home :width="18" :height="18"/>
          <nuxt-link to="/">
            Home
          </nuxt-link>
        </li>
        <li v-for="item in nav" :key="item.name">
          <component
            :is="item.icon"
            v-if="item.icon"
            aria-hidden="true"
            :height="18"
            :width="18"
          />

          <nuxt-link :to="item.path" aria-current="page">
            {{ item.name }}
          </nuxt-link>
        </li>
      </ul>

      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
  const nav = await useNav();
</script>

<style scoped>
  @reference "~/assets/css/main.css";

  .drawer-inner {
    @apply flex;
    @apply bg-base-100;
    @apply text-base-content;
    @apply min-h-full;
    @apply flex-col;
    @apply w-80;
    @apply p-4;

    > header {
      @apply flex;
      @apply rounded;
      @apply items-center;
      @apply justify-between;
      @apply bg-base-200;
      @apply py-2;
      @apply px-4;

      > h2 {
        @apply text-lg;
        @apply font-semibold;
        @apply font-serif;
        @apply italic;
      }

      > label {
        @apply btn;
        @apply btn-ghost;
        @apply btn-circle;
        @apply btn-sm;

        > svg {
          @apply w-5;
          @apply stroke-current;
          @apply h-5;
        }
      }
    }

    .menu {
      @apply flex-grow;
      @apply text-base-content;
      @apply w-full;
      @apply p-0;

      li {
        @apply flex;
        @apply flex-row;
        @apply items-center;
        @apply rounded-lg;
        @apply p-4;

        svg {
          @apply p-0;
          @apply flex-shrink-0;
          @apply w-5;
          @apply h-5;
        }

        a {
          @apply flex-1;
          @apply tracking-tighter;
          @apply text-base-content;
          @apply text-base;
          @apply p-0;
        }
      }

      li:hover {
        @apply bg-base-200;
        @apply rounded-none;

        /**
         * Disable the default color
         * because it conflicts with what we
         * want to happen when a user
         * hovers
         */
        a, a:hover {
          @apply bg-transparent;
        }
      }
    }
  }
</style>
