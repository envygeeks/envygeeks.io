<template>
  <div class="overflow-x-auto">
    <table class="table w-full border border-base-300">
      <template v-for="(group, groupIndex) in skills" :key="groupIndex">
        <thead>
          <tr class="bg-base-200 text-base-content font-bold">
            <template v-for="(header, headerIndex) in Object.keys(group)" :key="headerIndex">
              <th class="text-primary">{{ header }}</th>
            </template>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(rowIndex) in maxCount(group)" :key="rowIndex">
            <td v-for="(category, categoryIndex) in Object.keys(group)" :key="categoryIndex">
              {{ group[category][rowIndex - 1] || '' }}
            </td>
          </tr>
        </tbody>
      </template>
    </table>
  </div>
</template>

<script setup lang="ts">
  const { data } = await useAsyncData(
    'skills', async () => {
      return await queryContent(
        'data/skills',
      ).findOne();
    },
  );

  const skills = computed(() => {
    if (!data.value) return [];
    const entries = Object.entries(
      data.value.skills,
    );

    const groups = [];
    for (let i = 0; i < entries.length; i += 3) {
      groups.push(
        Object.fromEntries(
          entries.slice(i, i + 3),
        ),
      );
    }

    return groups;
  });

  const maxCount = (group) => {
    return Math.max(...Object.values(group).map(
      arr => arr.length,
    ));
  };
</script>

<style scoped>
  table {
    @apply font-sans;
    @apply mb-8;
  }

  th, td {
    @apply text-base;
    color: inherit;
  }

  td {
    @apply border-b-2;
    border-color: color-mix(
      in oklch, oklch(var(--n)), black 12%
    );
  }

  tr:nth-child(even) td {
    background-color: color-mix(
      in oklch, oklch(var(--n)), black 6%
    );
  }

  th {
    @apply text-primary;
    background-color: color-mix(
      in oklch, oklch(var(--n)), black 12%
    );
  }
</style>