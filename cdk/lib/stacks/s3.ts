import { Construct } from 'constructs';
import { Stack, StackProps } from '@infra/stack';
import { BlockPublicAccess, Bucket, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Remote } from 'conf';

export const SSM_KEY_LOGS_ARN = 'LogsBucketArn';
export const SSM_KEY_CONTENT_ARN = 'ContentBucketArn';
export class s3 extends Stack {
  readonly content: Bucket;
  readonly logs: Bucket;

  /**
   */
  constructor(
    scope: Construct,
    id: string, props: StackProps,
  ) {
    super(
      scope, id, props,
    );

    this.logs = new Bucket(
      this, 'Logs', {
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
        removalPolicy: RemovalPolicy.RETAIN,
        autoDeleteObjects: false,
        enforceSSL: true,
      },
    );

    new CfnOutput(
      this, 'LogsName', {
        value: this.logs.bucketName,
      },
    );

    Remote.setAndLog(
      this, SSM_KEY_LOGS_ARN, {
        value: this.logs.bucketArn,
      },
    );

    /**
     * Content
     */
    this.content = new Bucket(
      this, 'Content', {
        publicReadAccess: false,
        serverAccessLogsBucket: this.logs,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
        removalPolicy: RemovalPolicy.RETAIN,
        serverAccessLogsPrefix: 'content',
        autoDeleteObjects: false,
        enforceSSL: true,
      },
    );

    new CfnOutput(
      this, 'ContentName', {
        value: this.content.bucketName,
      },
    );

    Remote.set(
      this, SSM_KEY_CONTENT_ARN, {
        value: this.content.bucketArn,
      },
    );
  }
}
