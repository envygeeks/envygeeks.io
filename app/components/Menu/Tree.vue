<template>
  <ul class="menu">
    <menu-item
      v-for="(item, label) in paths"

      :key="label"
      :loader="loader"
      :label="label"
      :item="item"
    />
  </ul>
</template>

<script setup lang="ts">
  const { paths, loader } = defineProps({
    paths: {
      type: Object,
      required: true,
    },
    loader: {
      type: Function,
      required: true,
    },
  });
</script>

<style scoped>
  @reference "~/assets/css/main.css";

  .menu {
    @apply w-full;
  }
</style>
