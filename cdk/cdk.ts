import type { App } from 'conf';
import { Dns } from '@stacks/dns';
import { Roles } from '@stacks/roles';
import { AwsSolutionsChecks } from 'cdk-nag';
import { Aspects, App as CdkApp } from 'aws-cdk-lib';
import { Github } from '@stacks/github';
import { Tls } from '@stacks/tls';
import { Dev } from '@stages/dev';
import { s3 } from '@stacks/s3';
import { get } from 'env-var';

const app = new CdkApp();
const ci: boolean = get('CI').default('false').required().asBool();
const { CDK_DEFAULT_ACCOUNT: account, CDK_DEFAULT_REGION: region } = process.env;
const appName: App = get('APP_NAME').required().asString();
const envName = 'global';
Aspects.of(app).add(
  new AwsSolutionsChecks(),
);

/**
 */
const dns = new Dns(
  app, 'Dns', {
    envName,
    appName,
    env: {
      account, region,
    },
  },
);

/**
 */
new Roles(
  app, 'Roles', {
    envName,
    appName,
    env: {
      account, region,
    },
  },
);

/**
 */
new s3(
  app, 'S3', {
    envName,
    appName,
    env: {
      account, region,
    },
  },
);

/**
 */
const domain = get('DOMAIN').required().asString();
const wildcard = true;
new Tls(
  app, 'Tls', {
    envName,
    wildcard,
    appName,
    domain,
    dns,
    env: {
      account, region,
    },
  },
);

/**
 */
new Github(
  app, 'Github', {
    envName,
    appName,
    env: {
      account, region,
    },
  },
);

/**
 */
new Dev(
  app, 'Dev', {
    envName: 'dev',
    appName,
    env: {
      account, region,
    },
  },
);
