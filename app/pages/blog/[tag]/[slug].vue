<template>
  <nuxt-layout name="post">
    <blog-post
      v-if=post
      :post=post
      :main=true
    />
  </nuxt-layout>
</template>

<script setup lang=ts>
  import { addAuthor } from '~/helpers/posts/addAuthor';
  const route = useRoute();
  definePageMeta({
    name: 'blog-post',
    nav: false,
  });

  const { tag, slug } = route.params as { tag: string, slug: string };
  const { data: post } = await useAsyncData(
    'post', async () => {
      const app = useNuxtApp();
      const post = await queryContent()
        .where({
          _source: {
            $eq: 'blog',
          },
          _dir: {
            $eq: tag,
          },
          _path: {
            $regex: slug,
          },
        })
        .findOne();

      await app.runWithContext(async () => addAuthor(post));
      return post;
    },
  );

  if (!post.value) {
    showError({
      statusCode: 404,
      statusMessage: 'Page not found',
    });
  }
  else {
    const {
      title: {
        main,
      },
    } = useAppConfig();
    useHead({
      title: `${post.title}: ${main}`,
    });
  }
</script>
