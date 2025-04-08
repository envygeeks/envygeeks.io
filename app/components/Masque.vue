<template>
  <div v-if="type === 'div'">
    <slot />
  </div>
  <nuxt-img
    v-else
    :src="src"
    :style="computedStyle"
    :class="[
      position,
      computedClass,
      shape,
      'mask',
    ]"
  />
</template>
<script setup lang="ts">
  import { AllowedMasks } from '~/constants/AllowedMasks';
  import { useComputedStyle } from '#imports';
  import { useComputedClass } from '#imports';

  const props = defineProps({
    type: {
      type: String,
      default: 'img',
      validator(value: string): boolean {
        return ['img', 'div'].includes(
          value,
        );
      },
    },
    src: {
      type: String,
      required: true,
    },
    width: {
      default: 'w-24',
      required: false,
      type: [
        Number,
        String,
      ],
    },
    height: {
      default: 'h-24',
      required: false,
      type: [
        Number,
        String,
      ],
    },
    position: {
      type: String,
      default: 'left',
      required: false,
      validator(value: string): boolean {
        return ['left', 'right'].includes(
          value,
        );
      },
    },
    shape: {
      type: String,
      required: false,
      default: 'hexagon',
      validator(value: string): boolean {
        return AllowedMasks.includes(
          value,
        );
      },
    },
  });

  const { src, type, width, height } = props;
  const position = computed(() => props.position ? `float-${props.position}` : '');
  const computedClass = useComputedClass({ width, height });
  const computedStyle = useComputedStyle({ width, height });
  const shape = computed(() => `mask-${props.shape}`);
</script>

<style scoped>
  @reference "~/assets/css/main.css";

  @source inline("mask");
  @source inline("mask-circle");
  @source inline("mask-decagon");
  @source inline("mask-diamond");
  @source inline("mask-half-1");
  @source inline("mask-half-2");
  @source inline("mask-heart");
  @source inline("mask-hexagon");
  @source inline("mask-hexagon-2");
  @source inline("mask-parallelogram");
  @source inline("mask-parallelogram-2");
  @source inline("mask-parallelogram-3");
  @source inline("mask-parallelogram-4");
  @source inline("mask-pentagon");
  @source inline("mask-square");
  @source inline("mask-squircle");
  @source inline("mask-star");
  @source inline("mask-star-2");
  @source inline("mask-triangle");
  @source inline("mask-triangle-2");
  @source inline("mask-triangle-3");
  @source inline("mask-triangle-4");
  @source inline("float-right");
  @source inline("float-left");
</style>
