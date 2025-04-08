import { Construct, ConstructProps } from '@infra/construct';
import type { s3 } from '@stacks/nuxt/s3';
import { CfnOutput } from 'aws-cdk-lib';
import { CfnAccessKey, PolicyStatement, User } from 'aws-cdk-lib/aws-iam';
import { Construct as CdkConstruct } from 'constructs';
import { capitalize } from 'helpers';

export interface ImgixProps
extends ConstructProps {
  s3: s3
}

export class Imgix extends Construct {
  /**
   */
  constructor(
    scope: CdkConstruct,
    id: string, props: ImgixProps,
  ) {
    super(
      scope, id, props,
    );

    /**
     * Imgix
     */
    const capitalizedEnv = capitalize(this.env);
    const userName = `Imgix${capitalizedEnv}`;
    const imgixUser = new User(
      this, 'User', {
        userName,
      },
    );

    new CfnOutput(
      this, 'UserName', {
        value: imgixUser.userName,
      },
    );

    new CfnOutput(
      this, 'UserArn', {
        value: imgixUser.userArn,
      },
    );

    /**
     * Scope out Imgix user permissions
     *   even though we have little risk
     *   for assets that are technically
     *   public!
     */
    const bucketArn = props.s3.bucket.bucketArn;
    imgixUser.addToPolicy(
      new PolicyStatement({
        resources: [
          bucketArn,
        ],
        actions: [
          's3:ListBucket',
          's3:GetBucketLocation',
        ],
      }),
    );

    imgixUser.addToPolicy(
      new PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [
          `${bucketArn}/assets/*`,
        ],
      }),
    );

    /**
     * SECURITY RISK: low
     * It still uses regular
     *   access keys, please note
     *   that we scope it above!
     */
    const accessKey = new CfnAccessKey(
      this, 'AccessKey', {
        userName: imgixUser.userName,
      },
    );

    new CfnOutput(
      this, 'SecretAccessKey', {
        value: accessKey.attrSecretAccessKey,
      },
    );

    new CfnOutput(
      this, 'AccessKeyId', {
        value: accessKey.ref,
      },
    );
  }
}
