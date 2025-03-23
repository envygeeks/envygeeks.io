import type { Construct } from 'constructs';
import { Stage, type StageProps } from '../stage';
import type { App, Env } from '../config';
import { get } from 'env-var';

export class Dev extends Stage {
  public readonly env: Env = 'dev';
  public readonly app: App = get('APP_NAME').required().asString();
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    this.createNuxtStack();
  }
}