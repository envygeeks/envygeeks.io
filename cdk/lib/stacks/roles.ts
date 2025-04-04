import type { Construct } from 'constructs';
import { Stack, type StackProps } from '@infra/stack';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnOutput } from 'aws-cdk-lib';

export class Roles extends Stack {
  /**
   */
  constructor(
    scope: Construct,
    id: string, props: StackProps,
  ) {
    super(
      scope, id, props,
    );

    /**
     * AWS myApplications
     * We really only want to create this
     * in dev because we don't need more than
     * one role for the _entire_ account
     */
    const myAppsRole = new Role(
      this, 'MyAppsRole', {
        roleName: 'AWSResourceGroupsRoleForMyApplications',
        assumedBy: new ServicePrincipal(
          'resource-groups.amazonaws.com',
        ),
      },
    );

    new CfnOutput(
      this, 'MyAppsRoleName', {
        value: myAppsRole.roleName,
      },
    );

    new CfnOutput(
      this, 'MyAppsRoleArn', {
        value: myAppsRole.roleArn,
      },
    );
  }
}
