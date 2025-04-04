import { Env, App } from 'conf';
import { Construct as CdkConstruct } from 'constructs';
import { StackProps } from 'aws-cdk-lib';
import { Stack } from '@shared/stack';

/**
 */
export interface ConstructProps
extends StackProps {
  envName: Env
  appName: App
}

/**
 * Provides a class that wraps
 * construct and accepts props, so
 * that we can use the shared
 * helpers class
 */
export class ConstructWithProps
extends CdkConstruct {
  constructor(
    scope: CdkConstruct,
    id: string, _props: ConstructProps,
  ) {
    super(
      scope, id,
    );
  }
}

/**
 */
export class Construct
extends Stack(
  ConstructWithProps,
) {
  constructor(
    scope: CdkConstruct,
    id: string, props: ConstructProps,
  ) {
    super(
      scope, id, props,
    );
  }
}
