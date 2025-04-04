import { Construct, ConstructProps } from '@infra/construct';
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import { Construct as CdkConstruct } from 'constructs';

/**
 */
export class s3 extends Construct {
  public readonly bucket: Bucket;

  /**
   */
  constructor(
    scope: CdkConstruct,
    id: string, props: ConstructProps,
  ) {
    super(
      scope, id, props,
    );

    this.bucket = new Bucket(
      this, 'Static', {
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
        removalPolicy: RemovalPolicy.RETAIN,
        autoDeleteObjects: false,
      },
    );

    new CfnOutput(
      this, 'StaticName', {
        value: this.bucket.bucketName,
      },
    );

    new CfnOutput(
      this, 'StaticArn', {
        value: this.bucket.bucketArn,
      },
    );
  }
}
