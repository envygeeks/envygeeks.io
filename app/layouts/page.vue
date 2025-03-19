<template>
  <main class="content">
    <article class="page">
      <slot />
    </article>
  </main>
</template>

<style>
  .page {
    @apply mt-24;
    @apply w-full;
    @apply block;

  }
</style>
