import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cr from 'aws-cdk-lib/custom-resources';
import * as lambda from "aws-cdk-lib/aws-lambda";
import type { Construct } from 'constructs';
import * as path from 'node:path';
import type { Roles } from './roles';
import { get } from 'env-var';
import { NagSuppressions } from "cdk-nag";

const CdkHash: string = "hnb659fds" as const
const GithubTokenHost: string = "token.actions.githubusercontent.com" as const
const GithubThumbprintHash: string = "6938fd4d98bab03faadb97b34396831e3780aea1" as const
const GithubPrincipal: string = "sts.amazonaws.com" as const

export class Github extends cdk.Stack {
  constructor (scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);
    
    /**
     * OIDC Provider
     */
    const provider = new iam.OpenIdConnectProvider(
      this, 'Github-OIDC', {
        url: `https://${GithubTokenHost}`,
        clientIds: [GithubPrincipal],
        thumbprints: [
          GithubThumbprintHash,
        ],
      },
    );
    
    const repoOwner = get("REPO_OWNER").required().asString();
    const repoFilter = get("REPO_FILTER").required().asString();
    const repoName = get("REPO_NAME").required().asString();
    const webPrincipal = new iam.WebIdentityPrincipal(
      provider.openIdConnectProviderArn, {
        StringLike: {
          [`${GithubTokenHost}:sub`]: [
            `repo:${repoOwner}/${repoName}:${repoFilter}`,
          ],
        },
      },
    )
    
    const roleHandler = new lambda.Function(
      this, 'RoleHandler', {
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
    
    roleHandler.addToRolePolicy(
      new iam.PolicyStatement({
        resources: ['*'],
        actions: [
          'iam:ListRoles',
          'iam:ListRoleTags'
        ],
      })
    );
    
    // TODO: Last checked 03/24/2025
    NagSuppressions.addResourceSuppressions(
      roleHandler, [
        { id: 'AwsSolutions-IAM4', reason: 'CloudWatch logging' },
        { id: 'AwsSolutions-IAM5', reason: 'Needed for IAM Role Discovery' },
        { id: 'AwsSolutions-L1', reason: 'Global runtime matching' }
      ], true
    );
    
    const roleProvider  = new cr.Provider(
      this, 'CdkRoleProvider', {
        onEventHandler: roleHandler,
      }
    );
    
    // TODO: Last checked 03/24/2025
    NagSuppressions.addResourceSuppressions(
      roleProvider, [
        { id: 'AwsSolutions-IAM5', reason: 'Managed by CDK' },
        { id: 'AwsSolutions-IAM4', reason: 'CloudWatch logging' },
        { id: 'AwsSolutions-L1', reason: 'Managed by CDK' }
      ], true
    );
    
    const roleResource = new cdk.CustomResource(
      this, 'CdkRoleResource', {
        serviceToken: roleProvider.serviceToken,
        properties: {
          cdkRoles: [
            'file-publishing',
            'deploy',
          ]
        }
      }
    );

    const cdkRoles = roleResource.getAtt('cdkRoles').toStringList();
    const webPrincipalPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: cdkRoles,
      actions: [
        "sts:AssumeRole",
      ],
    });
    
    /**
     * IAM Role
     */
    const role = new iam.Role(
      this, 'Github-DeployRole', {
        maxSessionDuration: cdk.Duration.hours(1),
        roleName: 'github-deployer',
        assumedBy: webPrincipal,
        inlinePolicies: {
          CDKDeploy: new iam.PolicyDocument({
            statements: [
              webPrincipalPolicy,
            ],
          }),
        },
      },
    );
  }
  
  /**
   * Resolves and returns
   * the root directory path for
   * the CDK app
   */
  private get cdkRoot() {
    return path.join(
      __dirname, '..'
    );
  }
}
