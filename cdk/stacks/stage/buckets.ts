import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from 'constructs';
import * as stack from '../../lib/stack';
import * as cdk from "aws-cdk-lib";

export class Buckets extends stack.Stack {
  public readonly staticBucket: s3.Bucket;
  public readonly contentBucket: s3.Bucket;
  public readonly logsBucket: s3.Bucket;
  
  constructor (
    scope: Construct,
    id: string, props?: stack.StackProps
  ) {
    super(
      scope, id, props
    );
    
    /**
     * Logs
     */
    this.logsBucket = new s3.Bucket(
      this, 'Logs', {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
        objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
        encryption: s3.BucketEncryption.S3_MANAGED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        autoDeleteObjects: false,
      }
    );
    
    new cdk.CfnOutput(
      this, 'LogsName', {
        value: this.logsBucket.bucketName,
      }
    )
    
    new cdk.CfnOutput(
      this, 'LogsArn', {
        value: this.logsBucket.bucketArn,
      }
    )
    
    /**
     * Static
     */
    this.staticBucket = new s3.Bucket(
      this, 'Static', {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        autoDeleteObjects: false,
      },
    );
    
    new cdk.CfnOutput(
      this, 'StaticName', {
        value: this.staticBucket.bucketName,
      }
    )
    
    new cdk.CfnOutput(
      this, 'StaticArn', {
        value: this.staticBucket.bucketArn,
      }
    )
    
    /**
     * Content
     */
    this.contentBucket = new s3.Bucket(
      this, 'Content', {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        autoDeleteObjects: false,
      },
    );
    
    new cdk.CfnOutput(
      this, 'ContentName', {
        value: this.contentBucket.bucketName,
      }
    )
    
    new cdk.CfnOutput(
      this, 'ContentArn', {
        value: this.contentBucket.bucketArn,
      }
    )
  }
}