import { Construct, ConstructProps } from '@infra/construct';
import { CfnOutput, CustomResource, Duration } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { NagSuppressions } from 'cdk-nag';
import { Construct as CdkConstruct } from 'constructs';
import { join as joinPath } from 'node:path';

export class Finder extends Construct {
  readonly provider: Provider;
  readonly result: CustomResource;
  readonly func: Function;

  constructor(
    scope: CdkConstruct,
    id: string, props: ConstructProps,
  ) {
    super(
      scope, id, props,
    );

    this.func = new Function(
      this, 'Func', {
        handler: 'index.handler',
        timeout: Duration.seconds(30),
        runtime: Runtime.NODEJS_18_X,
        code: Code.fromAsset(
          joinPath(
            this.cdkRoot, 'lambda/cdk/roles',
          ),
        ),
      },
    );

    new CfnOutput(
      this, 'FuncArn', {
        value: this.func.functionArn,
      },
    );

    new CfnOutput(
      this, 'FuncName', {
        value: this.func.functionName,
      },
    );

    this.func.addToRolePolicy(
      new PolicyStatement({
        resources: ['*'],
        actions: [
          'iam:ListRoles',
          'iam:ListRoleTags',
        ],
      }),
    );

    // TODO: Last checked 03/24/2025
    NagSuppressions.addResourceSuppressions(
      this.func, [
        { id: 'AwsSolutions-IAM4', reason: 'CloudWatch logging' },
        { id: 'AwsSolutions-IAM5', reason: 'Needed for IAM Role Discovery' },
        { id: 'AwsSolutions-L1', reason: 'Global runtime matching' },
      ], true,
    );

    this.provider = new Provider(
      this, 'Provider', {
        onEventHandler: this.func,
      },
    );

    // TODO: Last checked 03/24/2025
    NagSuppressions.addResourceSuppressions(
      this.provider, [
        { id: 'AwsSolutions-IAM5', reason: 'Managed by CDK' },
        { id: 'AwsSolutions-IAM4', reason: 'CloudWatch logging' },
        { id: 'AwsSolutions-L1', reason: 'Managed by CDK' },
      ], true,
    );

    this.result = new CustomResource(
      this, 'CustomResource', {
        serviceToken: this.provider.serviceToken,
        properties: {
          cdkRoles: [
            'file-publishing',
            'deploy',
          ],
        },
      },
    );
  }
}
