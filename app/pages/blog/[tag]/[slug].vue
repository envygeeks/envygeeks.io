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
  type RouteParams = { tag: string, slug: string };
  const route = useRoute();
  definePageMeta({
    name: 'blog-post',
    nav: false,
  });

  const { tag, slug } = route.params as RouteParams;
  const { data: post } = await useAsyncData(
    'post', async () => {
      try {
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

        await app.runWithContext(
          async () => addAuthor(
            post,
          ),
        );

        return post;
      }
      catch(error) {
        console.log('Content Query Error: ', error);
        throw error;
      }
    },
  );

  const {
    title: {
      main,
    },
  } = useAppConfig();
  useHead({
    title: `${post.value?.title}: ${main}`,
  });

  if (!post.value) {
    showError({
      statusCode: 404,
      statusMessage: 'Page not found',
    });
  }
</script>
