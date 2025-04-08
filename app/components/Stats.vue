<template>
  <div v-for="(stats, title) in data?.stats" :key="title" class="skill-stats">
    <h2 class="header">
      {{ title }}
    </h2>

    <div class="box">
      <div
        v-for="(row, rowIndex) in chunk(
          Object.entries(stats), 2
        )"

        :key="rowIndex"
        class="row"
      >
        <div
          v-for="(
            [name, value], itemIndex
          ) in row"

          :key="itemIndex"
          class="item"
        >
          <span class="title">{{ name }}</span>
          <div class="graph">
            <div>
              <div
                :style="{
                  width: `${value}%`
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { data } = await useAsyncData(
    'stats', async () => {
      return await queryContent(
        'data/stats',
      ).findOne();
    },
  );

  function chunk<T>(arr: T[], size = 2): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(
        arr.slice(
          i, i + size,
        ),
      );
    }
    return result;
  }
</script>

<style scoped>
  @reference "~/assets/css/main.css";

  .skill-stats {
    @apply mb-12;
    @apply mx-auto;
    @apply shadow-lg;
    @apply max-w-[900px];
    @apply shadow-none;
    @apply rounded-lg;
    @apply bg-info;
    @apply w-full;
    @apply p-8;

    .header {
      @apply uppercase;
      @apply text-info-content;
      @apply text-left;
      @apply mb-6;
    }

    .box {
      @apply grid;
      @apply grid-cols-2;
      @apply gap-8;

      .row {
        @apply flex-col;
        @apply space-y-4;
        @apply flex;
      }
    }
  }

  .item {
    @apply flex;
    @apply items-center;

    .title {
      @apply text-lg;
      @apply text-info-content;
      @apply font-bold;
      @apply w-16;
    }

    .graph {
      @apply flex-1;
      @apply ml-4;

      > div {
        @apply h-[54px];
        @apply relative;
        background-color: color-mix(
          in oklch, var(--color-info), var(--color-info-content) 12%
        );

        div {
          @apply h-full;
          @apply absolute;
          @apply bg-info-content;
          @apply left-0;
          @apply top-0;
        }
      }
    }
  }
</style>
