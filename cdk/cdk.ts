import { Roles } from './lib/roles';
import { Dev } from './lib/stages/dev';
import { Prod } from './lib/stages/prod';
import { HostedZone } from './lib/hosted-zone';
import { AwsSolutionsChecks } from 'cdk-nag';
import { Aspects } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { get } from 'env-var';

const app = new cdk.App();
const { CDK_DEFAULT_ACCOUNT: account, CDK_DEFAULT_REGION: region } = process.env
const only = get("ONLY").asString();
Aspects.of(app).add(
  new AwsSolutionsChecks(),
);

let hostedZone: HostedZone|undefined = undefined;
if (!only || ["Dev", "Prod", ].includes(only)) {
  hostedZone = new HostedZone(
    app, 'HostedZone', {
      env: {
        account, region
      }
    }
  )
}
if (!only || only === "Dev") {
  new Dev(
    app, 'Dev', {
      hostedZone,
      env: {
        account, region
      }
    },
  );
}
if (!only || only === "Prod") {
  new Prod(
    app, 'Prod', {
      hostedZone,
      env: {
        account, region
      }
    },
  );
}
