import { Roles } from './lib/roles';
import { Dev } from './lib/stages/dev';
import { Prod } from './lib/stages/prod';
import { HostedZone } from './lib/hosted-zone';
import { DefaultEnv, type Env, Envs } from './lib/config';
import { AwsSolutionsChecks } from 'cdk-nag';
import { Aspects } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { get } from 'env-var';

const app = new cdk.App();
const { CDK_DEFAULT_ACCOUNT: account, CDK_DEFAULT_REGION: region } = process.env
const only = get("ONLY").default(DefaultEnv).asString();
Aspects.of(app).add(
  new AwsSolutionsChecks(),
);

if (
  only == "roles" ||
  Envs.includes(only as Env) ||
  !only
) {
  new Roles(
    app, 'Roles', {
      env: {
        account, region
      }
    },
  )
}
let hostedZone: HostedZone|undefined = undefined;
if (
  only === "hosted-zone" ||
  Envs.includes(only as Env) ||
  !only
) {
  hostedZone = new HostedZone(
    app, 'HostedZone', {
      env: {
        account, region
      }
    }
  )
}
if (!only || only === "dev") {
  new Dev(
    app, 'Dev', {
      hostedZone,
      env: {
        account, region
      }
    },
  );
}
if (!only || only === "prod") {
  new Prod(
    app, 'Prod', {
      hostedZone,
      env: {
        account, region
      }
    },
  );
}
