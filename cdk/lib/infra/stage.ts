import { Construct } from 'constructs';
import { Stack } from '@shared/stack';
import { Env, App } from 'conf';
import {
  Stage as CdkStage,
  StageProps as CdkStageProps,
} from 'aws-cdk-lib';

/**
 */
export interface StageProps
extends CdkStageProps {
  envName: Env
  appName: App
}

/**
 */
export class Stage
extends Stack(
  CdkStage,
) {
  /**
   */
  constructor(
    scope: Construct,
    id: string, props: StageProps,
  ) {
    super(
      scope, id, props,
    );
  }
}
