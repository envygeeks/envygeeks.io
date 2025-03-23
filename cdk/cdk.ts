import { Aspects } from 'aws-cdk-lib';
import { get } from 'env-var';
import { Dev } from './lib/stages/dev';
import { Prod } from './lib/stages/prod';
import { HostedZonesStack } from './lib/hosted-zones';
import { AwsSolutionsChecks } from 'cdk-nag';
import * as cdk from 'aws-cdk-lib';

const app = new cdk.App();
Aspects.of(app).add(
  new AwsSolutionsChecks(),
);

const only = get("ONLY").asString();
const hostedZones = new HostedZonesStack(
  app, 'HostedZones', {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    }
  }
)
if (!only || only === "Dev") {
  new Dev(
    app, 'Dev', {
      hostedZones,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      }
    },
  );
}
if (!only || only === "Prod") {
  new Prod(
    app, 'Prod', {
      hostedZones,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      }
    },
  );
}
