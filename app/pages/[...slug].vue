<template>
  <nuxt-layout name="page">
    <content-renderer
      ref="content"
      :value="page!"
      class="page__content"
      :components="{
        NuxtImg,
        Masque,
        Skills,
        Stats,
      }"
    >
      <template #empty>
        {{
          showError({
            statusCode: 404,
            statusMessage: 'Page not found'
          })
        }}
      </template>
    </content-renderer>
  </nuxt-layout>
</template>

<script setup lang=ts>
  import { Skills } from '#components';
  import { NuxtImg } from '#components';
  import { Masque } from '#components';
  import { Stats } from '#components';

  const route = useRoute();
  definePageMeta({
    name: 'pages',
    nav: false,
  });

  /**
   * Help to avoid a nasty bug
   * inside of Nuxt-Content where it won't
   * query if you use queryContent(...slug) or
   * any derivative thereof
   */
  let slug: string;
  if (Array.isArray(route.params.slug)) {
    slug = route.params.slug.join(
      '/',
    );
  }
  else {
    slug = route.params.slug;
  }

  slug = `/${slug}`;
  const { data: page } = await useAsyncData(
    'page', async () => {
      try {
        return await queryContent()
          .where({
            _path: { $eq: slug },
            _source: {
              $eq: 'pages',
            },
          }).findOne();
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
    title: `${page.value?.title ?? ''}: ${main}`,
  });
</script>
