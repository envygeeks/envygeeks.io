import * as buckets from './buckets';
import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from 'constructs';
import * as helpers from "../../lib/helpers";
import * as stack from "../../lib/stack"
import * as cdk from "aws-cdk-lib";

export interface UsersProps
extends stack.StackProps {
  buckets: buckets.Buckets,
}

export class Users extends stack.Stack {
  constructor(
    scope: Construct,
    id: string, props: UsersProps
  ) {
    super(
      scope, id, props
    );
    
    /**
     * Imgix
     */
    const capitalizedEnv = helpers.Helpers.capitalize(this.env);
    const userName = `Imgix${capitalizedEnv}`;
    const imgixUser = new iam.User(
      this, 'ImgixUser', {
        userName
      }
    );
    
    new cdk.CfnOutput(
      this, 'ImgixUserName', {
        value: imgixUser.userName,
      }
    );
    
    new cdk.CfnOutput(
      this, 'ImgixUserArn', {
        value: imgixUser.userArn,
      }
    );
    
    /**
     * Scope out Imgix user permissions
     *   even though we have little risk
     *   for assets that are technically
     *   public!
     */
    const bucketArn = props.buckets.staticBucket.bucketArn;
    imgixUser.addToPolicy(
      new iam.PolicyStatement({
        resources: [
          bucketArn
        ],
        actions: [
          's3:ListBucket',
          's3:GetBucketLocation',
        ],
      }),
    );
    
    imgixUser.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [
          `${bucketArn}/assets/*`,
        ]
      }),
    );
    
    /**
     * SECURITY RISK: low
     * It still uses regular
     *   access keys, please note
     *   that we scope it above!
     */
    const accessKey = new iam.CfnAccessKey(
      this, 'ImgixAccessKey', {
        userName: imgixUser.userName,
      },
    );
    
    new cdk.CfnOutput(
      this, 'ImgixSecretAccessKey', {
        value: accessKey.attrSecretAccessKey
      }
    );
    
    new cdk.CfnOutput(
      this, 'ImgixAccessKeyId', {
        value: accessKey.ref,
      }
    );
  }
}