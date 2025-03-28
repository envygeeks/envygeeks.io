import type { Construct } from 'constructs';
import * as stage from '../lib/stage'

export class Prod extends stage.Stage {
  constructor(
    scope: Construct,
    id: string, props: stage.StageProps
  ) {
    super(
      scope, id, props
    );
  }
}