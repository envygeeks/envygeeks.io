<template>
  <nav class="nav" aria-label="Main Navigation">
    <ul class="list">
      <li v-for="item in nav" :key="item.name">
        <component
          :is="item.icon"
          v-if="item.icon"
          aria-hidden="true"
          :height="18"
          :width="18"
        />

        <nuxt-link :to="item.path" class="link" aria-current="page">
          {{ item.name }}
        </nuxt-link>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
  const nav = await useNav();
</script>

<style scoped>
  .nav {
    @media (max-width: theme('screens.md')) {
      display: none;
    }

    .list {
      @apply space-x-4;
      @apply flex;
    }

    li {
      @apply font-light;
      @apply text-base-content;
      @apply items-center;
      @apply leading-7;
      @apply flex;
    }

    .link {
      @apply text-base;
      @apply font-bold;
      @apply text-base-content;
      @apply hover:text-fuchsia-500;
      @apply tracking-tighter;
      @apply no-underline;
      @apply font-sans;
    }
  }
</style>