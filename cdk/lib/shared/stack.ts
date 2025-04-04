import { Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { App, Env } from 'conf';
import { join } from 'node:path';

interface ReqProps {
  envName: Env
  appName: App
}

/**
 * Provides a shared base
 * that both stack and stage can
 * share with common methods and
 * setup that we don't
 * wanna dupe
 */
export function Stack<
  T extends new (...args: any[]) => Construct,
>(
  Base: T,
) {
  return class extends Base {
    readonly env: Env;
    readonly app: App;

    constructor(
      ...args: any[]
    ) {
      type onlyProps = [never, never, ReqProps];
      const [_, __, props]: onlyProps = args as never;
      if (!props) {
        throw new Error(
          'Missing props in Stack constructor',
        );
      }

      super(
        ...args as unknown[],
      );

      this.app = props.appName;
      this.env = props.envName;
      this.tagIt();
    }

    /**
     * Tag the stack so
     *   that sub-stacks and items
     *   also get tagged
     */
    tagIt(): void {
      Tags.of(this).add('env', this.env);
      Tags.of(this).add(
        'app', this.app,
      );
    }

    /**
     * Resolves and returns
     * the root directory path for
     * the CDK app
     */
    get cdkRoot() {
      return join(
        __dirname, '..', '..',
      );
    }

    /**
     * Resolves and returns
     * the root directory path for
     * the mono repo
     */
    get root() {
      return join(
        __dirname, '..', '..', '..',
      );
    }
  };
}
