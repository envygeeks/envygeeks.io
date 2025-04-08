<template>
  <li>
    <template v-if="!isFile">
      <details open>
        <summary><IconFolder /> {{ label }}</summary>
        <ul>
          <menu-item
            v-for="(sub_item, sub_label) in item"

            :key="sub_label"
            :loader="loader"
            :label="sub_label"
            :item="sub_item"
          />
        </ul>
      </details>
    </template>
    <template v-else>
      <a
        :class="{ current: current === item.path }"
        @click.prevent="loader(
          item.path, true
        )"
      >
        <IconCode />{{ item.title }}
      </a>
    </template>
  </li>
</template>

<script setup lang="ts">
  const current = useRoute()?.path;
  const { label, item, loader } = defineProps({
    label: {
      required: true,
      type: String,
    },
    item: {
      default: null,
      required: false,
      type: Object,
    },
    loader: {
      required: true,
      type: Function,
    },
  });

  const isFile = computed(() => {
    return 'title' in item && 'path' in item;
  });
</script>

<style scoped>
  @reference "~/assets/css/main.css";

  summary {
    font-weight: 600;
  }

  summary, a {
    @apply leading-none;
    @apply hover:rounded-none;
    @apply tracking-tighter;
    @apply rounded-none;
    @apply text-[16px];
    @apply p-4;
  }

  a.current,
  summary:hover,
  a:hover {
    @apply bg-base-200;
  }
</style>
