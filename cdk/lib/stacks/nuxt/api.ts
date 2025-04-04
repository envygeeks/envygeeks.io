import { join as joinPath } from 'node:path';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct, ConstructProps } from '@infra/construct';
import { Code, Function, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { CfnOutput, Duration, Fn, RemovalPolicy, Size } from 'aws-cdk-lib';
import { Construct as CdkConstruct } from 'constructs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import type { Ssr } from '@stacks/nuxt/ssr';
import {
  AccessLogFormat,
  EndpointType, LambdaIntegration,
  MethodLoggingLevel, RestApi,
  LogGroupLogDestination,
  TokenAuthorizer,
} from 'aws-cdk-lib/aws-apigateway';

export interface ApiProps
extends ConstructProps {
  ssr: Ssr
}

export class Api extends Construct {
  public readonly validator: Function;
  public readonly authorizer: TokenAuthorizer;
  public readonly tokenResolver: string;
  public readonly gateway: RestApi;
  public readonly token: Secret;

  /**
   */
  constructor(
    scope: CdkConstruct,
    id: string, props: ApiProps,
  ) {
    super(
      scope, id, props,
    );

    const logGroup = new LogGroup(
      this, 'LogGroup', {
        removalPolicy: RemovalPolicy.DESTROY,
      },
    );

    new CfnOutput(
      this, 'LogGroupName', {
        value: logGroup.logGroupName,
      },
    );

    this.token = new Secret(
      this, 'Token', {
        generateSecretString: {
          excludePunctuation: true,
          generateStringKey: 'value',
          secretStringTemplate: JSON.stringify({
            key: 'origin-token',
          }),
        },
      },
    );

    this.tokenResolver = Fn.join('', [
      '{{resolve:secretsmanager:', this.token.secretName, ':SecretString:value}}',
    ]);

    new CfnOutput(
      this, 'TokenName', {
        value: this.token.secretName,
      },
    );

    this.validator = new Function(
      this, 'Validator', {
        handler: 'index.handler',
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(5),
        tracing: Tracing.ACTIVE,
        memorySize: 128,
        code: Code.fromAsset(
          joinPath(
            this.cdkRoot, 'lambda/authorizer',
          ),
        ),
        environment: {
          NODE_ENV: 'production',
          ORIGIN_TOKEN: this.tokenResolver,
          ENV: this.env,
        },
      },
    );
    this.token.grantRead(
      this.validator,
    );

    new CfnOutput(
      this, 'ValidatorFunctionName', {
        value: this.validator.functionName,
      },
    );

    new CfnOutput(
      this, 'ValidatorFunctionArn', {
        value: this.validator.functionArn,
      },
    );

    this.authorizer = new TokenAuthorizer(
      this, 'Authorizer', {
        resultsCacheTtl: Duration.minutes(1),
        identitySource: 'method.request.header.x-origin-token',
        handler: this.validator,
      },
    );

    const integration = new LambdaIntegration(props.ssr.lambda);
    const logGroupDestination = new LogGroupLogDestination(logGroup);
    this.gateway = new RestApi(
      this, 'Gateway', {
        minCompressionSize: Size.bytes(100),
        endpointTypes: [EndpointType.REGIONAL],
        binaryMediaTypes: ['*/*'],
        deployOptions: {
          dataTraceEnabled: true,
          accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
          accessLogDestination: logGroupDestination,
          loggingLevel: MethodLoggingLevel.INFO,
          tracingEnabled: true,
          stageName: 'prod',
        },
        defaultMethodOptions: {
          authorizer: this.authorizer,
          authorizationType: this.authorizer.authorizationType,
          requestParameters: {
            'method.request.header.x-origin-token': true,
          },
        },
      },
    );
    this.gateway.root.addMethod('ANY', integration);
    this.gateway.root.addResource('{proxy+}')
      .addMethod(
        'ANY', integration,
      );

    new CfnOutput(
      this, 'RestApiId', {
        value: this.gateway.restApiId,
      },
    );
  }
}
