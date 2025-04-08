<template>
  <div class="snippets">
    <div class="list">
      <menu-tree
        :loader="load"
        :paths="menu"
      />
    </div>
    <div v-if="snippet" class="snippet">
      <h1 class="title">{{ snippet.title }}</h1>
      <content-renderer
        :value="snippet"
        class="content"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { ParsedContent } from '@nuxt/content';
  import type { MenuTree } from '~/types/MenuTree';

  definePageMeta({
    icon: 'folder',
    name: 'snippets',
    nav: true,
  });

  const router = useRouter();
  async function load(path: string, replace = false) {
    if (replace) await router.replace(path);

    if (!snippet.value || snippet.value._path !== path) {
      snippet.value = await queryContent()
        .where({
          _source: {
            $eq: 'snippets',
          },
          _path: {
            $eq: path,
          },
        })
        .findOne();
    }
  }

  const route = useRoute();
  const initSnippet = await useContentFirst('snippets');
  const menu = await useMenu('snippets', reactive<MenuTree>({}));
  const snippet: Ref<null|ParsedContent> = ref(null);
  const path = ref(
    route.path !== router.resolve('snippets').path
      ? route.path  || initSnippet.value?._path
      : initSnippet.value?._path,
  );

  onMounted(() => {
    if (path.value && path.value !== router.resolve('snippets').path) {
      load(path.value, false);
    }
  });
</script>

<style scoped>
  @reference "~/assets/css/main.css";

  .snippets {
    @apply grid;
    @apply lg:mt-24;
    @apply sm:mt-12;
    @apply grid-cols-1;
    @apply lg:grid-cols-3;
    @apply w-full;
    @apply gap-6;

    .list {
      @apply border-r;
      @apply border-base-300;
      @apply lg:col-span-1;
      @apply w-full;
    }

    .snippet {
      @apply lg:col-span-2;
    }

    h1.title {
      @apply font-sans;
      @apply font-extrabold;
      @apply tracking-tighter;
      @apply text-4xl;
      @apply pb-8;
    }
  }
</style>
