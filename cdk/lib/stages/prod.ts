import { Stage } from '../stage';
import type { Construct } from 'constructs';
import type { App, Env } from '../config';
import * as cdk from 'aws-cdk-lib'
import { get } from 'env-var';

export class Prod extends Stage {
  public readonly env: Env = 'prod';
  public readonly app: App = get('APP_NAME').required().asString();
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);
    this.createNuxtStack();
  }
}