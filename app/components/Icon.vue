<template>
  <svg
    stroke-width="1.2"
    :class="computedClass"
    :style="computedStyle"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
  >
    <g :color="computedColor">
      <slot />
    </g>
  </svg>
</template>

<script setup lang="ts">
  import { toRgb } from '#imports';

  const { width: _width, height: _height } = defineProps({
    width: {
      default: 24,
      required: false,
      type: [
        String,
        Number,
      ],
    },
    height: {
      default: 24,
      required: false,
      type: [
        String,
        Number,
      ],
    },
  });

  const width = _width as string|number;
  const height = _height as string|number;
  const computedColor = ref('rgb(0,0,0)');
  onMounted(() => {
    const styles = getComputedStyle(document.documentElement);
    computedColor.value = toRgb(styles.getPropertyValue(
      '--color-base-content',
    ));
  });

  /**
   * Decides if width/height
   * should be a Tailwind class
   * or inline style.
   */
  const computedClass = computed(() => {
    const out = [];

    if (typeof width === 'string') out.push(width);
    if (typeof height === 'string')
      out.push(height);
    return out;
  });

  const computedStyle = computed(() => {
    const out: { width?: string, height?: string } = {};
    if (typeof width === 'number') out.width = `${width}px`;
    if (typeof height === 'number')
      out.height = `${height}px`;
    return out;
  });
</script>

<style scoped>
  @reference "~/assets/css/main.css";

  svg {
    @apply inline;
    @apply mr-3;
  }
</style>
