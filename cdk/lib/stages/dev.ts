import { Stage, StageProps } from '../stage';
import type { Construct } from 'constructs';

export class Dev extends Stage {
  public readonly env: string = 'dev';
  public readonly app: string = get('APP_NAME').required().asString();
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    this.createNuxtStack();
  }
}