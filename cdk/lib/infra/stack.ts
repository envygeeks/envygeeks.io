import { Env, App } from 'conf';
import { Stack as SharedStack } from '@shared/stack';
import { Construct } from 'constructs';
import {
  Stack as CdkStack,
  StackProps as CdkStackProps,
} from 'aws-cdk-lib';

/**
 */
export interface StackProps
extends CdkStackProps {
  envName: Env
  appName: App
}

/**
 */
export class Stack
extends SharedStack(
  CdkStack,
) {
  /**
   */
  constructor(
    scope: Construct,
    id: string, props: StackProps,
  ) {
    super(
      scope, id, props,
    );
  }
}
