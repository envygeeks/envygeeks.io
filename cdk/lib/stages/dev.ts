import { Stage, StageProps } from '../stage';
import type { Construct } from 'constructs';

export class Dev extends Stage {
  public readonly env: string = 'dev';
  public readonly app: string = 'envygeeks.io';
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    this.createNuxtStack();
  }
}