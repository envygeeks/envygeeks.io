import { Construct, ConstructProps } from '@infra/construct';
import {
  CfnOutput,
  AssetStaging,
  Duration,
} from 'aws-cdk-lib';
import {
  Architecture,
  Code,
  Function,
  LayerVersion,
  Tracing,
} from 'aws-cdk-lib/aws-lambda';
import { join as joinPath } from 'node:path';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { DOCKER_ASSET, TARGET_NODE_VERSION } from 'conf';
import { Construct as CdkConstruct } from 'constructs';
import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

export class Ssr extends Construct {
  public readonly lambda: Function;
  public readonly builder: AssetStaging;
  public readonly depStaging: AssetStaging;
  public readonly appStaging: AssetStaging;
  public readonly nuxtRoot: string;

  /**
   */
  constructor(
    scope: CdkConstruct,
    id: string, props: ConstructProps,
  ) {
    super(scope, id, props);
    const { env } = this as {
      env: string
    };

    const nuxtRoot = this.nuxtRoot = joinPath(this.root, 'app');
    const nuxtOutputDir = joinPath(nuxtRoot, '.output');
    const builder = this.builder = new AssetStaging(
      this, 'Builder', {
        sourcePath: nuxtRoot,
        bundling: {
          image: DOCKER_ASSET,
          local: {
            tryBundle(dest: string): boolean {
              try {
                execSync(
                  'pnpm --filter=app clean:nuxt', {
                    cwd: nuxtRoot,
                    stdio: (
                      'inherit' as never
                    ),
                  },
                );

                execSync(
                  `pnpm --filter=app build:${env}`, {
                    cwd: nuxtRoot,
                    stdio: (
                      'inherit' as never
                    ),
                  },
                );

                console.log(
                  'nuxt build: ',
                  'copying ', nuxtOutputDir,
                  'to ', dest,
                );

                cpSync(
                  nuxtOutputDir, dest, {
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
      this, 'BuilderStagingDir', {
        value: this.builder.absoluteStagedPath,
      },
    );

    this.depStaging = new AssetStaging(
      this, 'DepStaging', {
        sourcePath: this.builder.absoluteStagedPath,
        assetHash: randomBytes(16).toString('hex'),
        bundling: {
          image: DOCKER_ASSET,
          local: {
            tryBundle(dest: string): boolean {
              try {
                const nmDestPath = joinPath(dest, 'node_modules');
                const absPath = builder.absoluteStagedPath;
                const nmPath = joinPath(absPath,
                  'server', 'node_modules',
                );

                console.log(
                  'nuxt deps: ',
                  'copying ', nmPath,
                  'to ', nmDestPath,
                );

                mkdirSync(nmDestPath);
                cpSync(
                  nmPath,
                  nmDestPath, {
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
      this, 'DepStagingDir', {
        value: this.depStaging.absoluteStagedPath,
      },
    );

    this.appStaging = new AssetStaging(
      this, 'AppStaging', {
        sourcePath: this.builder.absoluteStagedPath,
        assetHash: randomBytes(16).toString('hex'),
        bundling: {
          image: DOCKER_ASSET,
          local: {
            tryBundle(dest: string): boolean {
              try {
                const absPath = builder.absoluteStagedPath;
                const serverPath = joinPath(
                  absPath, 'server',
                );

                console.log(
                  'nuxt app: ',
                  'copying ', serverPath,
                  'to ', dest,
                );

                cpSync(
                  serverPath, dest, {
                    recursive: true,
                  },
                );

                const nmDir = joinPath(
                  dest, 'node_modules',
                );

                console.log(
                  'nuxt app: ',
                  'removing ', nmDir,
                );

                rmSync(nmDir, {
                  recursive: true,
                });

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
      this, 'AppStagingDir', {
        value: this.builder.absoluteStagedPath,
      },
    );

    const depsLayer = new LayerVersion(
      this, 'DepsLayer', {
        compatibleRuntimes: [
          TARGET_NODE_VERSION,
        ],
        code: Code.fromAsset(
          this.depStaging.absoluteStagedPath,
        ),
      });

    this.lambda = new Function(
      this, 'Ssr', {
        memorySize: 1024,
        handler: 'index.handler',
        runtime: TARGET_NODE_VERSION,
        architecture: Architecture.ARM_64,
        timeout: Duration.seconds(10),
        tracing: Tracing.ACTIVE,
        layers: [
          depsLayer,
        ],
        code: Code.fromAsset(
          this.appStaging.absoluteStagedPath,
        ),
        environment: {
          ENV_NAME: this.env,
          NODE_ENV: 'production',
          STAGE: this.env,
        },
      },
    );

    new CfnOutput(
      this, 'LambdaName', {
        value: this.lambda.functionName,
      },
    );

    new CfnOutput(
      this, 'LambdaArn', {
        value: this.lambda.functionArn,
      },
    );
  }
}
