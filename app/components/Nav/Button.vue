<template>
  <label for="sidebar-drawer" class="hamburger">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
      <path
        stroke-linecap="round"
        d="M4 6h16M4 12h16M4 18h16"
        stroke-linejoin="round"
        stroke-width="2"
      />
    </svg>
  </label>
</template>

<style scoped>
  .hamburger {
    @apply btn;
    @apply btn-ghost;
    @apply btn-circle;
    @apply lg:hidden;

    svg {
      @apply w-6;
      @apply stroke-current;
      @apply h-6;
    }
  }
</style>