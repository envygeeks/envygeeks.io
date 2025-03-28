import { Nuxt } from '../stacks/stage/nuxt';
import { Buckets } from '../stacks/stage/buckets';
import type { Construct } from 'constructs';
import { Users } from '../stacks/stage/users';
import { App, type Env } from './config';
import * as cdk from 'aws-cdk-lib';

/**
 */
export interface StageProps
extends cdk.StageProps {
  appName: App,
  envName: Env,
}

/**
 * Creates an isolated stage like
 * dev, or prod, that allows us to have
 * the same resources in each env without
 * having to manage the namespace
 */
export class Stage extends cdk.Stage {
  public app: App;
  public env: Env;
  
  constructor(
    scope: Construct, id: string,
    private readonly props: StageProps,
  ) {
    super(scope, id, props);
    this.env = props.envName;
    this.app = props.appName;
    
    /**
     * Stacks
     * Static
     */
    const buckets = new Buckets(
      this, 'Buckets',
      this.props
    );
    
    /**
     * Stacks
     * Nuxt
     */
    new Nuxt(
      this, 'Nuxt', {
        ...this.props, buckets
      }
    );
    
    /**
     * Stacks
     * Users
     */
    new Users(
      this, 'Users', {
        ...this.props,
        buckets,
      }
    )
  }
  
  /**
   * Add Stack Tags
   * @private
   */
  private tagIt() {
    cdk.Tags.of(this).add('env', this.env);
    cdk.Tags.of(this).add(
      'app', this.app
    );
  }
}