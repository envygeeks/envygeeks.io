import { Dev } from './lib/stages/dev';
import { Prod } from './lib/stages/prod';
import { HostedZone } from './lib/hosted-zone';
import { AwsSolutionsChecks } from 'cdk-nag';
import { Aspects } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { get } from 'env-var';

const app = new cdk.App();
Aspects.of(app).add(
  new AwsSolutionsChecks(),
);

const only = get("ONLY").asString();
const hostedZone = new HostedZone(
  app, 'HostedZone', {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    }
  }
)
if (!only || only === "Dev") {
  new Dev(
    app, 'Dev', {
      hostedZone,
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
      hostedZone,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      }
    },
  );
}
