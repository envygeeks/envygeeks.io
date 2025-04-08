<template>
  <div>
    <masque
      shape="heart"
      alt="Lego pile"
      src="/lego-pile.jpg"
      height="100%"
      width="100%"
    />

    <h2>Coming Soon!</h2>
  </div>
</template>

<script setup lang="ts">
  definePageMeta({
    icon: 'home',
    name: 'blog-tag',
    nav: false,
  });
</script>

<style scoped>
  @reference "~/assets/css/main.css";

  div {
    @apply w-full;
    @apply relative;
    @apply h-auto;
    @apply mt-24;

    h2 {
      @apply absolute;
      @apply items-center;
      @apply justify-center;
      @apply inset-0;
      @apply flex;

      @apply text-white;
      @apply font-extrabold;
      @apply tracking-tighter;
      @apply drop-shadow-md;
      @apply text-6xl;
    }
  }
</style>
