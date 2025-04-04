import { Construct } from 'constructs';
import { Nuxt } from '@stacks/nuxt';

/**
 * Provides a shared base
 * that both stack and stage can
 * share with common methods and
 * setup that we don't
 * wanna dupe
 */
export function Stage<
  T extends new (...args: any[]) => Construct,
>(
  Base: T,
) {
  return class extends Base {
    constructor(
      ...args: any[]
    ) {
      super(
        ...args as unknown[],
      );

      type onlyProps = [unknown, unknown, never];
      const [_, __, props]: onlyProps = args as never;
      new Nuxt(
        this, 'Nuxt', props,
      );
    }
  };
}
