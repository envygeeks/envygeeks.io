import { Github } from './lib/github';
import { Roles } from './lib/roles';
import { Dev } from './lib/stages/dev';
import { Prod } from './lib/stages/prod';
import { HostedZone } from './lib/hosted-zone';
import { AwsSolutionsChecks } from 'cdk-nag';
import { Aspects, Aws } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';

const app = new cdk.App();
const { CDK_DEFAULT_ACCOUNT: account, CDK_DEFAULT_REGION: region } = process.env
let hostedZone: HostedZone|undefined = undefined;
Aspects.of(app).add(
  new AwsSolutionsChecks(),
);

const roles = new Roles(
  app, 'Roles', {
    env: {
      account, region
    }
  },
);
new Github(
  app, 'Github', {
    env: {
      account, region
    }
  }
);
hostedZone = new HostedZone(
  app, 'HostedZone', {
    env: {
      account, region
    }
  }
);
new Dev(
  app, 'Dev', {
    env: {
      account, region
    }
  },
);
new Prod(
  app, 'Prod', {
    env: {
      account, region
    }
  },
);
