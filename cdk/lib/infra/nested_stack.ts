// noinspection JSUnusedGlobalSymbols

import type { Construct } from 'constructs';
import type { App, Env } from 'conf';
import { Stack } from '@shared/stack';
import {
  NestedStack as CdkNestedStack,
  NestedStackProps as CdkNestedStackProps,
} from 'aws-cdk-lib';

/**
 */
export interface NestedStackProps
extends CdkNestedStackProps {
  envName: Env
  appName: App
}

/**
 */
export class NestedStack
extends Stack(
  CdkNestedStack,
) {
  /**
   */
  constructor(
    scope: Construct,
    id: string, props: NestedStackProps,
  ) {
    super(
      scope, id, props,
    );
  }
}
