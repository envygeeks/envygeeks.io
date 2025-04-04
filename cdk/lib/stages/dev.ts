import { Stage, StageProps } from '@infra/stage';
import { Stage as SharedStage } from '@shared/stage';
import { Construct } from 'constructs';

/**
 * Creates an isolated stage like
 * dev, or prod, that allows us to have
 * the same resources in each env without
 * having to manage the namespace
 */
export class Dev
extends SharedStage(
  Stage,
) {
  constructor(
    scope: Construct,
    id: string, props: StageProps,
  ) {
    super(
      scope, id, props,
    );
  }
}
