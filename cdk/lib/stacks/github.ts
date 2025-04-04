import { CfnOutput, Duration } from 'aws-cdk-lib';
import { Finder } from '@stacks/github/finder';
import { Stack, StackProps } from '@infra/stack';
import { Construct } from 'constructs';
import { get } from 'env-var';
import {
  Effect,
  PolicyStatement,
  OpenIdConnectProvider,
  WebIdentityPrincipal,
  PolicyDocument,
  Role,
} from 'aws-cdk-lib/aws-iam';

const TokenHost: string = 'token.actions.githubusercontent.com';
const ThumbprintHash: string = '6938fd4d98bab03faadb97b34396831e3780aea1';
const Principal: string = 'sts.amazonaws.com';

export class Github extends Stack {
  /**
   */
  constructor(
    scope: Construct,
    id: string, props: StackProps,
  ) {
    super(
      scope, id, props,
    );

    const oidc = new OpenIdConnectProvider(
      this, 'Oidc', {
        clientIds: [Principal],
        url: `https://${TokenHost}`,
        thumbprints: [
          ThumbprintHash,
        ],
      },
    );

    new CfnOutput(
      this, 'OidcArn', {
        value: oidc.openIdConnectProviderArn,
      },
    );

    const repoOwner = get('REPO_OWNER').required().asString();
    const repoFilter = get('REPO_FILTER').required().asString();
    const repoName = get('REPO_NAME').required().asString();
    const principal = new WebIdentityPrincipal(
      oidc.openIdConnectProviderArn, {
        StringLike: {
          [`${TokenHost}:sub`]: [
            `repo:${repoOwner}/${repoName}:${repoFilter}`,
          ],
        },
      },
    );

    const finder = new Finder(this, 'CdkRoleFinder', props);
    const cdkRoles = finder.result.getAtt('cdkRoles').toStringList();
    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: cdkRoles,
      actions: [
        'sts:AssumeRole',
      ],
    });

    const policy = new PolicyDocument({
      statements: [
        policyStatement,
      ],
    });

    const role = new Role(
      this, 'Role', {
        roleName: 'github-deployer',
        maxSessionDuration: Duration.hours(1),
        assumedBy: principal,
        inlinePolicies: {
          CDKDeploy: policy,
        },
      },
    );

    new CfnOutput(
      this, 'RoleName', {
        value: role.roleName,
      },
    );

    new CfnOutput(
      this, 'RoleArn', {
        value: role.roleArn,
      },
    );
  }
}
