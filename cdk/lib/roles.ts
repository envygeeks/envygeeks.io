import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from 'constructs';
import { Stack, Aws, Duration } from "aws-cdk-lib";
import * as path from 'node:path';

export class Roles extends Stack {
  constructor (scope: Construct, id: string, props?: any) {
    super(scope, id, props);
    
    /**
     * AWS myApplications
     * We really only want to create this
     * in dev because we don't need more than
     * one role for the _entire_ account
     */
    new iam.Role(
      this, 'ResourceGroupsRole', {
        roleName: 'AWSResourceGroupsRoleForMyApplications',
        assumedBy: new iam.ServicePrincipal(
          'resource-groups.amazonaws.com',
        ),
      }
    );
  }
}