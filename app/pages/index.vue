<template>
  <nuxt-layout name="blog">
    <blog-post
      v-for="post in posts"
      :key="post._path"
      :main="false"
      :excerpt="true"
      :post="post"
    />

    <div
      v-if="!loadedEverything && !loading"
      ref="sentinel"
      class="sentinel"
    />
    <div v-if="loading">
      Loading more posts...
    </div>
  </nuxt-layout>
</template>

<script setup lang="ts">
  import { useIntersectionObserver } from '@vueuse/core';
  import { addAuthors } from '~/helpers/posts/addAuthor';
  import { addExcerpts } from '~/helpers/posts/addExcerpt';
  import type { ParsedContent } from '@nuxt/content';

  const app = useNuxtApp();
  definePageMeta({
    name: 'home',
    nav: false,
  });

  const skip = ref(0);
  const posts = ref<ParsedContent[]>([]);
  const loadedEverything = ref(false);
  const loading = ref(false);
  const limit = 3;

  async function loadPosts() {
    loading.value = true;

    let query = queryContent();
    if (!import.meta.dev) {
      query = query.where({
        draft: {
          $eq: false,
        },
      });
    }

    const data = await query
      .where({
        _source: { $eq: 'blog' },
        draft_in_dev: {
          $eq: false,
        },
      })
      .limit(limit)
      .skip(skip.value)
      .sort({
        created_at: -1,
      })
      .find();

    if (!data || data.length === 0) {
      loadedEverything.value = true;
    } else {
      skip.value += limit;
      await app.runWithContext(() => addExcerpts(data!));
      await app.runWithContext(async () => {
        return addAuthors(data!);
      });
    }

    loading.value = false;
    posts.value.push(
      ...data!,
    );
  }

  await loadPosts();
  const sentinel = ref<HTMLElement | null>(null);
  useIntersectionObserver(
    sentinel, ([{ isIntersecting }]) => {
      if (isIntersecting) {
        loadPosts();
      }
    },
  );
</script>
