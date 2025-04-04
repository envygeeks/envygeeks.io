import type { Ssr } from '@stacks/nuxt/ssr';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { execSync } from 'node:child_process';
import { AssetStaging, CfnOutput } from 'aws-cdk-lib';
import { Construct, ConstructProps } from '@infra/construct';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct as CdkConstruct } from 'constructs';
import { join as joinPath } from 'node:path';
import type { s3 } from '@stacks/nuxt/s3';
import { DOCKER_ASSET } from 'conf';
import { cpSync } from 'node:fs';

export interface SyncProps
extends ConstructProps {
  ssr: Ssr
  s3: s3
}

/**
 */
export class Sync extends Construct {
  public readonly bucket: Bucket;

  /**
   */
  constructor(
    scope: CdkConstruct,
    id: string, props: SyncProps,
  ) {
    super(
      scope, id, props,
    );

    const pubStaging = new AssetStaging(
      this, 'DepStaging', {
        sourcePath: props.ssr.builder.absoluteStagedPath,
        bundling: {
          image: DOCKER_ASSET,
          local: {
            tryBundle(dest: string): boolean {
              try {
                const absPath = props.ssr.builder.absoluteStagedPath;
                const pubPath = joinPath(
                  absPath, 'public',
                );

                console.log(
                  'nuxt pub: ',
                  'copying ', pubPath,
                  'to ', dest,
                );

                cpSync(
                  pubPath, dest, {
                    recursive: true,
                  },
                );

                execSync(
                  'ls -la', {
                    stdio: 'inherit',
                    cwd: dest,
                  },
                );

                return true;
              }
              catch (error) {
                console.error(error);
                console.error('App failed to asset');
                return false;
              }
            },
          },
        },
      },
    );

    new CfnOutput(
      this, 'PubStaging', {
        value: pubStaging.absoluteStagedPath,
      },
    );

    new BucketDeployment(
      this, 'Sync', {
        memoryLimit: 1024,
        destinationBucket: props.s3.bucket,
        sources: [
          Source.asset(
            pubStaging.absoluteStagedPath,
          ),
        ],
      },
    );
  }
}
