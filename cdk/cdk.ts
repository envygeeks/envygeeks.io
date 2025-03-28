import { get } from 'env-var';
import * as nag from 'cdk-nag';
import * as cdk from 'aws-cdk-lib';
import * as config from './lib/config';
import { Github } from './stacks/github';
import { HostedZone } from './stacks/hosted-zone';
import { Roles } from './stacks/roles';
import { Dev } from './stages/dev';
import { Prod } from './stages/prod';

const app = new cdk.App();
const { CDK_DEFAULT_ACCOUNT: account, CDK_DEFAULT_REGION: region } = process.env
const appName: config.App = get('APP_NAME').required().asString();
cdk.Aspects.of(app).add(
  new nag.AwsSolutionsChecks(),
);

new Roles(
  app, 'Roles', {
    envName: 'global',
    appName,
    env: {
      account, region
    }
  },
);
new Github(
  app, 'Github', {
    envName: 'global',
    appName,
    env: {
      account, region
    }
  }
);
new HostedZone(
  app, 'HostedZone', {
    envName: 'global',
    appName,
    env: {
      account, region
    }
  }
);
new Dev(
  app, 'Dev', {
    envName: 'dev',
    appName,
    env: {
      account, region
    }
  },
);
new Prod(
  app, 'Prod', {
    envName: 'prod',
    appName,
    env: {
      account, region
    }
  },
);
