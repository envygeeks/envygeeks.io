import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from 'constructs';
import * as stack from '../lib/stack';

export class Roles extends stack.Stack {
  constructor (
    scope: Construct,
    id: string, props?: stack.StackProps
  ) {
    super(
      scope, id, props
    );
    
    /**
     * AWS myApplications
     * We really only want to create this
     * in dev because we don't need more than
     * one role for the _entire_ account
     */
    const resourceGroupRole = new iam.Role(
      this, 'ResourceGroupsRole', {
        roleName: 'AWSResourceGroupsRoleForMyApplications',
        assumedBy: new iam.ServicePrincipal(
          'resource-groups.amazonaws.com',
        ),
      }
    );
    
    new cdk.CfnOutput(
      this, 'ResourceGroupsRoleName', {
        value: resourceGroupRole.roleName,
      }
    )
    
    new cdk.CfnOutput(
      this, 'ResourceGroupsRoleArn', {
        value: resourceGroupRole.roleArn,
      }
    )
  }
}