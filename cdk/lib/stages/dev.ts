import type { App, Env } from '../config';
import type { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { Stage } from '../stage';
import { get } from 'env-var';

export class Dev extends Stage {
  public readonly env: Env = 'dev';
  public readonly app: App = get('APP_NAME').required().asString();
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);
    this.createNuxtStack();
  }
}