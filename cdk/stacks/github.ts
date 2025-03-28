import * as cdk from "aws-cdk-lib";
import * as stack from '../lib/stack';
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cr from 'aws-cdk-lib/custom-resources';
import type { Construct } from 'constructs';
import * as path from 'node:path';
import * as nag from "cdk-nag";
import { get } from 'env-var';

const TokenHost: string = "token.actions.githubusercontent.com" as const
const ThumbprintHash: string = "6938fd4d98bab03faadb97b34396831e3780aea1" as const
const Principal: string = "sts.amazonaws.com" as const

export class Github extends stack.Stack {
  constructor (
    scope: Construct,
    id: string, props: stack.StackProps
  ) {
    super(
      scope, id, props
    );
    
    /**
     * OIDC Provider
     */
    const provider = new iam.OpenIdConnectProvider(
      this, 'Oidc', {
        url: `https://${TokenHost}`,
        clientIds: [Principal],
        thumbprints: [
          ThumbprintHash,
        ],
      },
    );
    
    new cdk.CfnOutput(
      this, 'OidcProviderArn', {
        value: provider.openIdConnectProviderArn,
      }
    )
    
    /**
     * Since we don't know what
     * the Arn of any given CDK role, we
     * created a Lambda and Custom Resource
     * to grab those role Arn's for us!
     */
    const cdkRoleFinder = new lambda.Function(
      this, 'CdkRoleFinder', {
        handler: 'index.handler',
        timeout: cdk.Duration.seconds(30),
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset(
          path.join(
            this.cdkRoot, 'lambda/cdk/roles'
          )
        ),
      }
    );
    
    new cdk.CfnOutput(
      this, 'CdkRoleFinderArn', {
        value: cdkRoleFinder.functionArn,
      }
    )
    
    new cdk.CfnOutput(
      this, 'CdkRoleFinderName', {
        value: cdkRoleFinder.functionName,
      }
    )
    
    cdkRoleFinder.addToRolePolicy(
      new iam.PolicyStatement({
        resources: ['*'],
        actions: [
          'iam:ListRoles',
          'iam:ListRoleTags'
        ],
      })
    );
    
    // TODO: Last checked 03/24/2025
    nag.NagSuppressions.addResourceSuppressions(
      cdkRoleFinder, [
        { id: 'AwsSolutions-IAM4', reason: 'CloudWatch logging' },
        { id: 'AwsSolutions-IAM5', reason: 'Needed for IAM Role Discovery' },
        { id: 'AwsSolutions-L1', reason: 'Global runtime matching' }
      ], true
    );
    
    const cdkRoleProvider  = new cr.Provider(
      this, 'CdkRoleProvider', {
        onEventHandler: cdkRoleFinder,
      }
    );
    
    // TODO: Last checked 03/24/2025
    nag.NagSuppressions.addResourceSuppressions(
      cdkRoleProvider, [
        { id: 'AwsSolutions-IAM5', reason: 'Managed by CDK' },
        { id: 'AwsSolutions-IAM4', reason: 'CloudWatch logging' },
        { id: 'AwsSolutions-L1', reason: 'Managed by CDK' }
      ], true
    );
    
    const cdkRoleProviderResource = new cdk.CustomResource(
      this, 'CdkRoleProviderResource', {
        serviceToken: cdkRoleProvider.serviceToken,
        properties: {
          cdkRoles: [
            'file-publishing',
            'deploy',
          ]
        }
      }
    );

    const repoOwner = get("REPO_OWNER").required().asString();
    const repoFilter = get("REPO_FILTER").required().asString();
    const repoName = get("REPO_NAME").required().asString();
    const principal = new iam.WebIdentityPrincipal(
      provider.openIdConnectProviderArn, {
        StringLike: {
          [`${TokenHost}:sub`]: [
            `repo:${repoOwner}/${repoName}:${repoFilter}`,
          ],
        },
      },
    )
    
    const cdkRoles = cdkRoleProviderResource.getAtt('cdkRoles').toStringList();
    const policyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: cdkRoles,
      actions: [
        "sts:AssumeRole",
      ],
    });
    
    const policy = new iam.PolicyDocument({
      statements: [
        policyStatement,
      ],
    });
    
    /**
     * IAM Role
     */
    const role = new iam.Role(
      this, 'GithubDeployer', {
        roleName: 'github-deployer',
        maxSessionDuration: cdk.Duration.hours(1),
        assumedBy: principal,
        inlinePolicies: {
          CDKDeploy: policy
        },
      },
    );
    
    new cdk.CfnOutput(
      this, 'RoleName', {
        value: role.roleName
      }
    )
    
    new cdk.CfnOutput(
      this, 'RoleArn', {
        value: role.roleArn,
      }
    )
  }
}
