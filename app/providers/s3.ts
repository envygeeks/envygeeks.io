import { createOperationsGenerator } from '#image';
import type { ProviderGetImage } from '@nuxt/image';
import { joinURL } from 'ufo';

const operationsGenerator = createOperationsGenerator();
// noinspection JSUnusedGlobalSymbols
export function getImage(
  src: string, {
    modifiers = {}, baseUrl,
  }: {
    modifiers?: Record<string, never>,
    baseUrl?: string
  } = {},
): ReturnType<ProviderGetImage> {
  console.log('getImage', src, modifiers);
  if (!baseUrl) {
    const config = useRuntimeConfig();
    const s3bucket = config.public.s3bucket;
    baseUrl = `https://${s3bucket}.s3.us-east-1.amazonaws.com`;
  }

  const opts = operationsGenerator(modifiers);
  const url = joinURL(
    baseUrl!, src + (
      opts ? `?${opts}` : ''
    ),
  );
  
  console.log('getImage', url);
  return {
    url,
  };
}