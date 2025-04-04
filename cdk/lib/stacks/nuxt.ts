import { Api } from '@stacks/nuxt/api';
import { Cdn } from '@stacks/nuxt/cdn';
import { Imgix } from '@stacks/nuxt/imgix';
import { s3 as NuxtS3 } from '@stacks/nuxt/s3';
import { Stack, type StackProps } from '@infra/stack';
import type { Construct } from 'constructs';
import { Sync } from '@stacks/nuxt/sync';
import { Ssr } from '@stacks/nuxt/ssr';

export class Nuxt extends Stack {
  /**
   */
  constructor(
    scope: Construct,
    id: string, props: StackProps,
  ) {
    super(
      scope, id, props,
    );

    /**
     */
    const s3 = new NuxtS3(
      this, 's3',
      props,
    );

    /**
     */
    const ssr = new Ssr(
      this, 'Ssr',
      props,
    );

    /**
     */
    const api = new Api(
      this, 'Api', {
        ...props,
        ssr,
      },
    );

    /**
     */
    const imgix = new Imgix(
      this, 'Imgix', {
        ...props,
        s3,
      },
    );
    imgix.node
      .addDependency(
        s3,
      );

    /**
     */
    new Cdn(
      this, 'Cdn', {
        ...props,
        api, s3,
      },
    );

    /**
     */
    const sync = new Sync(
      this, 'Sync', {
        ...props,
        ssr,
        s3,
      },
    );
    sync.node.addDependency(ssr);
    sync.node.addDependency(
      s3,
    );
  }
}
