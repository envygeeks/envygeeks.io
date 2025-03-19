<template>
  <masque
    :src="avatarPath"
    :style="computedStyle"
    :class="computedClass"
    :position="position"
    :shape="shape"
  />
</template>

<script setup lang="ts">
  import { useComputedStyle, useComputedClass  } from '#imports';
  const { width, height, name, shape, position } = defineProps({
    width: {
      required: false,
      default: 24,
      type: [
        Number,
        String,
      ],
    },
    height: {
      required: false,
      default: 24,
      type: [
        Number,
        String,
      ],
    },
    name: {
      type: String,
      required: true,
    },
    shape: {
      required: false,
      default: 'heart',
      type: String,
    },
    position: {
      default: 'left',
      required: false,
      type: String,
    },
  });

  const computedStyle = useComputedStyle({ width, height });
  const computedClass = useComputedClass({ width, height });
  const avatarPath = computed(() => {
    return `/avatars/${name}.jpg`;
  });
</script>