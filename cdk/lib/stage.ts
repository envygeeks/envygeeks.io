import type { Construct } from 'constructs';
import { NuxtStack } from './stack';
import {
  Stage as CdkStage, Tags,
  type StageProps as CdkStageProps,
} from 'aws-cdk-lib';

export interface StageProps extends CdkStageProps {
  imgixOrigin: string
}

/**
 */
export class Stage extends CdkStage {
  public env: string;
  public app: string;
  
  constructor(
    scope: Construct, id: string,
    private readonly props?: StageProps,
  ) {
    super(
      scope, id, props,
    );
  }
  
  protected createNuxtStack() {
    Tags.of(this).add('env', this.env);
    Tags.of(this).add('app', this.app);
    new NuxtStack(
      this, 'Nuxt', this.props,
    );
  }
}