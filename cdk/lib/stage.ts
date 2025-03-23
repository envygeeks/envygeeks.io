import type { Construct } from 'constructs';
import type { HostedZonesStack } from './hosted-zones';
import { App, type Env } from './config';
import { NuxtStack } from './stack';
import {
  Stage as CdkStage, Tags,
  type StageProps as CdkStageProps,
} from 'aws-cdk-lib';

export interface StageProps
extends CdkStageProps {
  hostedZones: HostedZonesStack;
}

/**
 */
export class Stage extends CdkStage {
  public hostedZones: HostedZonesStack;
  public app: App;
  public env: Env;
  
  constructor(
    scope: Construct, id: string,
    private readonly props?: StageProps,
  ) {
    super(scope, id, props);
    if (!props?.hostedZones) {
      throw new Error(
        'Hosted Zone is required'
      );
    }
    
    this.hostedZones =
      props.hostedZones;
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
    new NuxtStack(
      this, 'Nuxt', this.props,
    );
  }
}