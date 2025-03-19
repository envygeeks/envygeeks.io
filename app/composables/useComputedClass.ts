export function useComputedClass(props: {
  width: number | string; height: number | string
}): ComputedRef<string[]> {
  return computed(() => {
    const out = [];

    const { width: w, height: h } = props;
    if (typeof w === 'string') out.push(w);
    if (typeof h === 'string') out.push(
      h,
    );

    return out;
  });
}