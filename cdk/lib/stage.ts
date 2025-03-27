import { App, type Env } from './config';
import type { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { Nuxt } from './nuxt';

/**
 */
export class Stage extends cdk.Stage {
  public app: App;
  public env: Env;
  
  constructor(
    scope: Construct, id: string,
    private readonly props?: cdk.StageProps,
  ) {
    super(
      scope, id, props
    );
  }
  
  
  /**
   * Add Stack Tags
   * @protected
   */
  private tagIt() {
    cdk.Tags.of(this).add('env', this.env);
    cdk.Tags.of(this).add(
      'app', this.app
    );
  }
  
  /**
   * Trigger NuxtStack
   * @protected
   */
  protected createNuxtStack() {
    this.tagIt();
    new Nuxt(
      this, 'Nuxt', this.props,
    );
  }
}