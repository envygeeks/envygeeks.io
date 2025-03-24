import { App, type Env } from './config';
import type { HostedZone } from './hosted-zone';
import type { Construct } from 'constructs';
import { Nuxt } from './nuxt';
import {
  Stage as CdkStage, CfnOutput, Tags,
  type StageProps as CdkStageProps,
} from 'aws-cdk-lib';

export interface StageProps
extends CdkStageProps {
  hostedZone: HostedZone;
}

/**
 */
export class Stage extends CdkStage {
  public hostedZone: HostedZone;
  public app: App;
  public env: Env;
  
  constructor(
    scope: Construct, id: string,
    private readonly props?: StageProps,
  ) {
    super(scope, id, props);
    if (!props?.hostedZone) {
      throw new Error(
        'Hosted Zone is required'
      );
    }
    
    this.hostedZone =
      props.hostedZone;
  }
  
  
  /**
   * Add Stack Tags
   * @protected
   */
  private tagIt() {
    Tags.of(this).add('env', this.env);
    Tags.of(this).add(
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