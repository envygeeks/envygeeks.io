<template>
  <div class="error-container">
    <h1 v-if="error.statusCode === 404">Oops!<span v-if="error.statusCode === 404"> 404</span></h1>
    <p>{{ error.message ?? 'An unexpected error occurred.' }}</p>
    <NuxtLink to="/" @click="handleError">
      Home
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
  import type { NuxtError } from '#app';
  const handleError = () => clearError({ redirect: '/' });
  const { error } = defineProps({
    error: {
      type: Object as () => NuxtError,
      required: true,
    },
  });

  useHead({
    title: error.statusCode === 404
      ? 'Page Not Found'
      : 'Error',
  });
</script>

<style scoped>
  @tailwind utilities;
  @tailwind components;
  @tailwind base;

  .error-container {
    padding: 50px;
    @apply h-screen;
    text-align: center;
    background:
      linear-gradient(
        135deg,
        oklch(35% 0.25 280 / 60%) 0%,
        oklch(50% 0.4 310  / 60%) 24%,
        oklch(60% 0.5 330  / 60%) 50%,
        oklch(65% 0.3 10   / 60%) 100%,
      )
    ;

    a {
      @apply mt-8;
      @apply btn;
    }

    h1 {
      @apply font-extrabold;
      @apply tracking-tighter;
      @apply text-8xl;
    }
  }
</style>