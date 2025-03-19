<template>
  <article class="post">
    <aside ref="aside" class="tags">
      <ul>
        <li v-for="tag in post.tags" :key="tag">
          <nuxt-link :to="{ name: 'blog-tag', params: { tag }}">
            #{{ tag }}
          </nuxt-link>
        </li>
      </ul>
    </aside>

    <header ref="header" class="title">
      <h1>
        <template v-if="main">{{ post.title }}</template>
        <template v-else>
          <nuxt-link :href="post._path">
            {{ post.title }}
          </nuxt-link>
        </template>
      </h1>
    </header>

    <footer ref="footer" class="meta">
      <div class="avatar">
        <nuxt-link :href="post.author.website">
          <nuxt-img
            fit="contain"
            loading="lazy"
            :src="post.author.avatarUrl"
            :alt="post.author.name"
            height="48"
            width="48"
          />
        </nuxt-link>
      </div>

      <div class="info">
        <span class="author">
          <nuxt-link :href="post.author.website">
            {{ post.author.name }}
          </nuxt-link>
        </span>

        <span class="date">
          <time :datetime="computedCreatedAt">
            <client-only>{{ $dayjs(post.created_at).fromNow() }}</client-only>
          </time>
        </span>
      </div>
    </footer>

    <content-renderer
      ref="content"
      :value="post"
      :excerpt="excerpt"
      class="content"
      :components="{
        NuxtImg
      }"
    />
  </article>

  <div class="divider">
    <span class="btn">
      <nuxt-link :href="post._path">
        Read More!
      </nuxt-link>
    </span>
  </div>
</template>

<script setup lang="ts">
  import { NuxtImg } from '#components';
  const props = defineProps({
    post: {
      type: Object,
      required: true,
    },
    main: {
      type: Boolean,
      default: false,
    },
    excerpt: {
      type: Boolean,
      default: false,
    },
  });

  const {
    post,
    excerpt,
    main,
  } =
    props;

  /**
   * Ensure that the tag from the path
   * structure on the inside of the app is
   * available on the tag list, so that
   * there isn't a discrepancy
   */
  const splitPaths = post._path.split('/');
  const baseTag = splitPaths.at(-2);
  post.tags = post.tags ?? [];
  post.tags.unshift(baseTag);
  post.tags = [
    ...new Set(post.tags),
  ];

  const dayjs = useDayjs();
  const computedCreatedAt: ComputedRef<string> = computed(() => {
    return dayjs(post.created_at).utc().toString();
  });
</script>

<style>
  @tailwind base;

  @layer base {
    .post {
      .tags {
        @apply text-base;

        ul {
          @apply flex;
          @apply flex-wrap;
          @apply justify-start;
          @apply space-x-4;

          li {
            @apply font-sans;
            @apply ml-0 !important;
            @apply mr-4 !important;
            @apply pb-2;

            a:hover {
              @apply text-secondary;
            }
          }
        }
      }

      .title {
        h1 {
          @apply font-sans;
          @apply font-extrabold;
          @apply tracking-tighter;
          @apply leading-none;
          /*@apply text-4xl;*/
          @apply p-0;
        }
      }

      .meta {
        @apply mb-12;
        @apply text-base;
        @apply items-center;
        @apply font-sans;
        @apply flex;
        @apply mt-4;

        .author,
        .date {
          @apply inline-block;
        }

        .author {
          @apply font-extrabold;
          @apply text-neutral;
          @apply mr-2;
        }

        .author:hover {
          @apply text-secondary;
        }

        .avatar {
          @apply flex-shrink-0;
          display: none;

          a {
            @apply p-[1px];
            @apply rounded-[50%];
            @apply border-gray-200;
            @apply w-[3.4rem];
            @apply h-[3.4rem];
            @apply border-2;
            @apply block;
          }

          img {
            @apply object-cover;
            @apply rounded-[50%];
          }
        }
      }
    }
  }
</style>
