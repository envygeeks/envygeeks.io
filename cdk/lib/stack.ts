import * as path from 'node:path';
import type { Construct } from 'constructs';
import type * as config from './config';
import * as cdk from "aws-cdk-lib";

/**
 */
export interface StackProps
extends cdk.StackProps {
  envName: config.Env|config.GlobalEnv,
  appName: config.App,
}

/**
 * Provides a stack with
 * common items of which we can use
 * including env, app, and usable
 * paths for Aws Lambda
 */
export class Stack extends cdk.Stack {
  public readonly env: config.Env|config.GlobalEnv;
  public readonly app: config.App;
  
  constructor (
    scope: Construct, id:
    string, props?: StackProps
  ) {
    super(scope, id, props);
    this.app = props!.appName;
    this.env = props!.envName;
    this.tagIt();
  }
  
  /**
   * Tag the stack so
   *   that sub-stacks and items
   *   also get tagged
   */
  tagIt(): void {
    cdk.Tags.of(this).add('env', this.env);
    cdk.Tags.of(this).add(
      'app', this.app
    );
  }
  
  /**
   * Resolves and returns
   * the root directory path for
   * the CDK app
   */
  protected get cdkRoot() {
    return path.join(
      __dirname, '..'
    );
  }
  
  /**
   * Resolves and returns
   * the root directory path for
   * the mono repo
   */
  protected get root() {
    return path.join(
      __dirname, '..', '..'
    );
  }
}