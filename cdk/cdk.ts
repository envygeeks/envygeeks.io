import { Aspects } from 'aws-cdk-lib';
import { Dev } from './lib/stages/dev';
import { AwsSolutionsChecks } from 'cdk-nag';
import { Prod } from './lib/stages/prod';
import * as cdk from 'aws-cdk-lib';
import { get } from 'env-var';

const app = new cdk.App();
Aspects.of(app).add(
  new AwsSolutionsChecks(),
);

new Dev(
  app, 'Dev', {
    imgixOrigin: get('IMGIX_DEV_ORIGIN')
      .required().asString(),
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    }
  },
);
new Prod(
  app, 'Prod', {
    imgixOrigin: get('IMGIX_PROD_ORIGIN')
      .required().asString(),
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    }
  },
);

