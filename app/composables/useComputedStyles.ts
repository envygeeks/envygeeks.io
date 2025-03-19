export function useComputedStyle(props: {
  width: number | string; height: number | string
}): ComputedRef<Record<string, string>> {
  return computed(() => {
    const { width: w, height: h } = props;
    const out: Record<string, string> = {};
    if (typeof w === 'number') out.width = `${w}px`;
    if (typeof h === 'number')
      out.height = `${h}px`;

    return out;
  });
}