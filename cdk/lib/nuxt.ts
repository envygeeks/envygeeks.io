import {
  AssetHashType,
  CfnOutput,
  DockerImage,
  Duration,
  Fn,
  RemovalPolicy,
  Size,
  Stack,
  type StackProps,
} from 'aws-cdk-lib';
import {
  AccessLogFormat,
  LambdaIntegration,
  LogGroupLogDestination,
  MethodLoggingLevel,
  RestApi,
  TokenAuthorizer,
} from 'aws-cdk-lib/aws-apigateway';
import { EndpointType } from 'aws-cdk-lib/aws-apigatewayv2';
import {
  AccessLevel,
  AllowedMethods,
  type BehaviorOptions,
  CachedMethods,
  CachePolicy,
  Distribution,
  Function as CfFunction,
  FunctionCode,
  FunctionEventType,
  HeadersFrameOption,
  HeadersReferrerPolicy,
  HttpVersion,
  OriginRequestCookieBehavior,
  OriginRequestHeaderBehavior,
  OriginRequestPolicy,
  OriginRequestQueryStringBehavior,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin, S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CfnAccessKey, PolicyStatement, User } from 'aws-cdk-lib/aws-iam';
import {
  Code,
  Function,
  LayerVersion,
  Runtime,
  Tracing,
} from 'aws-cdk-lib/aws-lambda';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl,
  BucketEncryption,
  ObjectOwnership,
} from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from 'aws-cdk-lib/custom-resources';
import type { Construct } from 'constructs';
import { get } from 'env-var';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Stage } from './stage';

/**
 * Cost Estimate (per month) for the Entire
 * Stack with X-Ray enabled, 100K requests/month,
 * and an average of 4 images per page,
 * excluding free tier usage (free
 * services are calculated)
 *
 * | Component         | Estimated Cost      |
 * |-------------------|---------------------|
 * | CloudFront        | ~$4.00              |
 * | API Gateway       | ~$0.40              |
 * | Lambda            | ~$0.10              |
 * | S3 (Assets)       | ~$1.00              |
 * | CloudWatch Logs   | ~$2.00              |
 * | X-Ray             | ~$0                 |
 * |-------------------|---------------------|
 * | **Total**         | **~$7.50/month**    |
 * |-------------------|---------------------|
 *
 * Note: Actual costs vary by region, usage,
 * and AWS pricing updates.
 */
export class Nuxt extends Stack {
  constructor (
    scope: Construct,
    id: string, props?: StackProps
  ) {
    super(scope, id, props);
    const stage = (scope as Stage);
    const cdkRoot = path.join(__dirname, '..')
    const root = path.join(
      __dirname, '../..'
    );
    
    const imgixOrigin = get('IMGIX_ORIGIN').required().asString();
    if (!imgixOrigin) {
      throw new Error(
        'imgixOrigin is required'
      );
    }
    
    /**
     * Logs
     */
    const logs = new Bucket(this, 'Logs', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });
    
    /**
     * Static
     */
    const _static = new Bucket(
      this, 'Static', {
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
        removalPolicy: RemovalPolicy.RETAIN,
        autoDeleteObjects: false,
      },
    );
    
    /**
     * Content
     */
    const content = new Bucket(
      this, 'Content', {
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
        removalPolicy: RemovalPolicy.RETAIN,
        autoDeleteObjects: false,
      },
    );
    
    /**
     * Proxy Logs
     * RestAPI
     * HttpAPI
     */
    const gatewayLogGroup = new LogGroup(
      this, 'GatewayLogs', {
        removalPolicy: RemovalPolicy.DESTROY,
      },
    );
    
    /**
     * SSR
     */
    const imgName = 'public.ecr.aws/sam/build-nodejs18.x';
    const backupImg = DockerImage.fromRegistry(
      imgName,
    );
    
    /**
     * Main Lambda layer
     */
    const ssrCode = Code.fromAsset(
      root, {
        assetHashType: AssetHashType.SOURCE,
        exclude: ['node_modules'],
        bundling: {
          image: backupImg,
          local: {
            tryBundle(dest: string): boolean {
              try {
                const io = {
                  stdio: (
                    'inherit' as never
                  ),
                };

                execSync('pnpm --filter=app cleanup', io);
                execSync(`pnpm --filter=app build:${stage.env}`, io);
                const server = path.join(root, 'app/.output/server');
                fs.cpSync(server, dest, {
                  recursive: true,
                });
                
                return true;
              }
              catch (error) {
                console.error(error);
                return false;
              }
            },
          },
        },
      },
    );
    
    /**
     * Lambda Layer with assets
     * This way we can try to optimize
     * our Lambda!
     */
    const ssrDepsCode = Code.fromAsset(
      root, {
        assetHashType: AssetHashType.SOURCE,
        bundling: {
          image: backupImg,
          local: {
            tryBundle(dest: string): boolean {
              try {
                const io = {
                  stdio: (
                    'inherit' as never
                  ),
                };

                const _var = 'NUXT_OUTPUT_DIR=.dep';
                const nodeModules = path.join(
                  root, 'app/.dep/server/node_modules'
                );

                execSync(`${_var} pnpm --filter=app cleanup`, io);
                execSync(`${_var} pnpm --filter=app build:${stage.env}`, io);
                fs.cpSync(path.join(nodeModules), dest, {
                  recursive: true,
                });
                
                return true;
              }
              catch (error) {
                console.error(error);
                return false;
              }
            },
          },
        },
      },
    );
    
    const ssrDeps = new LayerVersion(
      this, 'SsrDeps', {
        compatibleRuntimes: [Runtime.NODEJS_18_X],
        code: ssrDepsCode,
      },
    );
    
    const ssr = new Function(
      this, 'Ssr', {
        handler: 'index.handler',
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(10),
        tracing: Tracing.ACTIVE,
        layers: [ssrDeps],
        memorySize: 1024,
        code: ssrCode,
        environment: {
          NODE_ENV: 'production',
          IPX_DOMAIN: _static.bucketWebsiteDomainName,
          ENVYGEEKS_ENV: stage.env,
          STAGE: stage.env,
        },
      },
    );
    _static.grantRead(
      ssr,
    );
    
    /**
     * Sync Static
     */
    const deploy = new BucketDeployment(
      this, 'Sync', {
        destinationBucket: _static,
        memoryLimit: 1024,
        sources: [
          Source.asset(path.join(
            root, 'app/.output/public'
          )),
        ],
      },
    );
    // We build with SSR
    deploy.node.addDependency(
      ssr,
    );
    
    /**
     * SSR Token
     * The non-secret token used by
     * Cloudfront to ship a header for API gateway
     * to authorize the request, this helps
     * prevent direct Gateway access
     */
    const ssrToken = new Secret(this, 'SsrToken', {
      generateSecretString: {
        excludePunctuation: true,
        generateStringKey: 'value',
        secretStringTemplate: JSON.stringify({
          key: 'origin-token',
        }),
      },
    });
    
    const ssrTokenResolver = Fn.join('', [
      '{{resolve:secretsmanager:', ssrToken.secretName, ':SecretString:value}}'
    ])
    
    /**
     * SSR Authorizer
     * The generic authorizer for RestApi
     * to verify that the header token matches
     * the stored token on our side
     */
    const ssrAuthorizer = new Function(
      this, 'SsrAuthorizer', {
        runtime: Runtime.NODEJS_18_X,
        handler: 'authorizer.handler',
        code: Code.fromAsset(path.join(cdkRoot, 'authorizer')),
        timeout: Duration.seconds(5),
        tracing: Tracing.ACTIVE,
        memorySize: 128,
        environment: {
          NODE_ENV: 'production',
          ORIGIN_TOKEN: ssrTokenResolver,
          ENV: stage.env,
        },
      },
    );
    ssrToken.grantRead(
      ssrAuthorizer,
    );
    
    /**
     * RestApi Authorizer
     * Used by RestApi to verify the
     * request with a token
     */
    const restAuthorizer = new TokenAuthorizer(
      this, 'RestAuthorizer', {
        resultsCacheTtl: Duration.minutes(1),
        identitySource: 'method.request.header.x-origin-token',
        handler: ssrAuthorizer,
      },
    );
    
    /**
     * RestApi Integration
     */
    const restIntegration = new LambdaIntegration(
      ssr,
    );
    
    /**
     * RestApi
     */
    const restApiStageName = 'prod';
    const logGroupDestination = new LogGroupLogDestination(gatewayLogGroup);
    const restApi = new RestApi(
      this, 'RestApi', {
        endpointTypes: [EndpointType.REGIONAL],
        minCompressionSize: Size.bytes(100),
        binaryMediaTypes: ['*/*'],
        deployOptions: {
          dataTraceEnabled: true,
          accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
          accessLogDestination: logGroupDestination,
          loggingLevel: MethodLoggingLevel.INFO,
          stageName: restApiStageName,
          tracingEnabled: true,
        },
        defaultMethodOptions: {
          authorizer: restAuthorizer,
          requestParameters: {
            'method.request.header.x-origin-token': true,
          },
        },
      },
    );
    restApi.root.addMethod('ANY', restIntegration);
    restApi.root.addResource('{proxy+}').addMethod(
      'ANY', restIntegration,
    );
    
    /**
     * Cdn
     */
    const gatewayId = restApi.restApiId;
    const gatewayHostname = `${gatewayId}.execute-api.${this.region}.amazonaws.com`;
    const stripAssetsFunc = new CfFunction(
      this, 'RewriteAssetsFunction', {
        code: FunctionCode.fromInline(`
          function handler(event) {
            var request = event.request;
            if (request.uri.startsWith("/assets/")) {
              request.uri = request.uri.replace(/^\\/assets/, '');
            }
            
            return request;
          }
        `),
      },
    );

    /**
     * Origins
     */
    const imgOrigin = new HttpOrigin(imgixOrigin!);
    const gifOrigin = new HttpOrigin(imgixOrigin!);
    const staticOrigin = S3BucketOrigin.withOriginAccessControl(
      _static, {
        originAccessLevels: [
          AccessLevel.READ,
        ],
      },
    );
    
    const ssrOrigin = new HttpOrigin(
      gatewayHostname, {
        originPath: `/${restApiStageName}`,
        customHeaders: {
          'x-origin-token': ssrTokenResolver,
        },
      },
    );
    
    /**
     * assets/*
     * Cf Cache
     */
    const imgCache = new CachePolicy(
      this, 'ImgCache', {
        maxTtl: Duration.days(365),
        cookieBehavior: OriginRequestCookieBehavior.none(),
        defaultTtl: Duration.days(1), minTtl: Duration.seconds(0),
        queryStringBehavior: OriginRequestQueryStringBehavior.all(),
        headerBehavior: OriginRequestHeaderBehavior.allowList(
          'Accept', 'Accept-Language', 'User-Agent',
        ),
      },
    );
    
    /**
     * assets/*.gif
     * Cf Cache
     */
    const gifCache = new CachePolicy(
      this, 'GifCache', {
        maxTtl: Duration.days(365),
        cookieBehavior: OriginRequestCookieBehavior.none(),
        defaultTtl: Duration.days(1), minTtl: Duration.seconds(0),
        queryStringBehavior: OriginRequestQueryStringBehavior.none(),
        headerBehavior: OriginRequestHeaderBehavior.allowList(
          'Accept', 'Accept-Language', 'User-Agent',
        ),
      },
    );
    
    /**
     * _nuxt/*
     * Cf Cache
     */
    const staticCache = new CachePolicy(
      this, 'StaticCache', {
        maxTtl: Duration.days(365),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
        cookieBehavior: OriginRequestCookieBehavior.none(),
        defaultTtl: Duration.days(1), minTtl: Duration.seconds(0),
        queryStringBehavior: OriginRequestQueryStringBehavior.none(),
        headerBehavior: OriginRequestHeaderBehavior.allowList(
          'Accept', 'Accept-Language', 'User-Agent',
        ),
      },
    );
    
    /**
     * Root
     * Cf Cache
     */
    const ssrCache = new CachePolicy(
      this, 'SsrCache', {
        enableAcceptEncodingBrotli: true,
        cookieBehavior: OriginRequestCookieBehavior.none(),
        defaultTtl: Duration.days(1), minTtl: Duration.seconds(0),
        queryStringBehavior: OriginRequestQueryStringBehavior.none(),
        headerBehavior: OriginRequestHeaderBehavior.none(),
        enableAcceptEncodingGzip: true,
        maxTtl: Duration.days(365),
      },
    );
    
    /**
     * Origin Requests
     * These policies control what parts
     * of the client’s request (such as cookies,
     * query strings, and headers) are forwarded from
     * CloudFront to your origin.
     * assets/*
     */
    const imgRequest = new OriginRequestPolicy(
      this, 'ImgRequest', {
        cookieBehavior: OriginRequestCookieBehavior.none(),
        queryStringBehavior: OriginRequestQueryStringBehavior.all(),
        headerBehavior: OriginRequestHeaderBehavior.none(),
      },
    );
    
    /**
     * assets/*.gif
     */
    const gifRequest = new OriginRequestPolicy(
      this, 'GifRequest', {
        cookieBehavior: OriginRequestCookieBehavior.none(),
        queryStringBehavior: OriginRequestQueryStringBehavior.none(),
        headerBehavior: OriginRequestHeaderBehavior.none(),
      },
    );
    
    /**
     * Root
     */
    const ssrRequest = new OriginRequestPolicy(
      this, 'SsrRequest', {
        cookieBehavior: OriginRequestCookieBehavior.all(),
        queryStringBehavior: OriginRequestQueryStringBehavior.all(),
        headerBehavior: OriginRequestHeaderBehavior.allowList(
          'Accept',
          'Accept-Language',
          'CloudFront-Forwarded-Proto',
          'X-Forwarded-For',
          'User-Agent',
          'Via',
        ),
      },
    );
    
    /**
     * _nuxt/*
     */
    const staticRequest = new OriginRequestPolicy(
      this, 'StaticRequest', {
        cookieBehavior: OriginRequestCookieBehavior.none(),
        queryStringBehavior: OriginRequestQueryStringBehavior.none(),
        headerBehavior: OriginRequestHeaderBehavior.none(),
      },
    );
    
    // Shared Policy Identifiers
    const frameOption = HeadersFrameOption.SAMEORIGIN;
    const accessControlMaxAge = Duration.seconds(31536000);
    const referrerPolicy = HeadersReferrerPolicy
      .STRICT_ORIGIN_WHEN_CROSS_ORIGIN;
    
    const imgResponse = new ResponseHeadersPolicy(
      this, 'ImgResponse', {
        corsBehavior: {
          originOverride: false,
          accessControlAllowCredentials: false,
          accessControlAllowOrigins: ['*'],
          accessControlAllowHeaders: [
            'Content-Type', 'Cache-Control',
            'Last-Modified',
            'ETag',
          ],
          accessControlExposeHeaders: [
            'Content-Type', 'Cache-Control',
            'Last-Modified',
            'ETag',
          ],
          accessControlAllowMethods: [
            'GET', 'HEAD',
            'OPTIONS',
          ],
        },
        securityHeadersBehavior: {
          frameOptions: { override: true, frameOption },
          referrerPolicy: { referrerPolicy, override: true },
          xssProtection: { modeBlock: true, protection: true, override: true },
          contentTypeOptions: { override: true },
          strictTransportSecurity: {
            accessControlMaxAge,
            override: true,
          },
        },
        customHeadersBehavior: {
          customHeaders: [
            {
              header: 'Cache-Control',
              value: 'public, max-age=63072000',
              override: false,
            },
          ],
        },
      },
    );
    
    const gifResponse = new ResponseHeadersPolicy(
      this, 'GifResponse', {
        corsBehavior: {
          originOverride: false,
          accessControlAllowCredentials: false,
          accessControlAllowOrigins: ['*'],
          accessControlAllowHeaders: [
            'Content-Type', 'Cache-Control',
            'Last-Modified',
            'ETag',
          ],
          accessControlExposeHeaders: [
            'Content-Type', 'Cache-Control',
            'Last-Modified',
            'ETag',
          ],
          accessControlAllowMethods: [
            'GET', 'HEAD',
            'OPTIONS',
          ],
        },
        securityHeadersBehavior: {
          frameOptions: { override: true, frameOption },
          referrerPolicy: { referrerPolicy, override: true },
          xssProtection: { modeBlock: true, protection: true, override: true },
          contentTypeOptions: { override: true },
          strictTransportSecurity: {
            accessControlMaxAge,
            override: true,
          },
        },
        customHeadersBehavior: {
          customHeaders: [
            {
              header: 'Cache-Control',
              value: 'public, max-age=63072000',
              override: false,
            },
          ],
        },
      },
    );
    
    const staticResponse = new ResponseHeadersPolicy(
      this, 'StaticResponse', {
        corsBehavior: {
          originOverride: false,
          accessControlAllowCredentials: false,
          accessControlAllowOrigins: ['*'],
          accessControlAllowHeaders: [
            'Content-Type', 'Cache-Control',
            'Last-Modified',
            'ETag',
          ],
          accessControlExposeHeaders: [
            'Content-Type', 'Cache-Control',
            'Last-Modified',
            'ETag',
          ],
          accessControlAllowMethods: [
            'GET', 'HEAD',
            'OPTIONS',
          ],
        },
        securityHeadersBehavior: {
          frameOptions: { override: true, frameOption },
          referrerPolicy: { referrerPolicy, override: true },
          xssProtection: { modeBlock: true, protection: true, override: true },
          contentTypeOptions: { override: true },
          strictTransportSecurity: {
            accessControlMaxAge,
            override: true,
          },
        },
        customHeadersBehavior: {
          customHeaders: [
            {
              header: 'Cache-Control',
              value: 'public, max-age=63072000',
              override: false,
            },
          ],
        },
      },
    );
    
    /**
     * Root
     */
    const ssrResponse = new ResponseHeadersPolicy(
      this, 'SsrResponse', {
        corsBehavior: {
          originOverride: false,
          accessControlAllowCredentials: false,
          accessControlAllowOrigins: ['*'],
          accessControlAllowHeaders: [
            'Content-Type', 'Cache-Control',
            'Last-Modified',
            'ETag',
          ],
          accessControlExposeHeaders: [
            'Content-Type', 'Cache-Control',
            'Last-Modified',
            'ETag',
          ],
          accessControlAllowMethods: [
            'GET', 'HEAD',
            'OPTIONS',
          ],
        },
        securityHeadersBehavior: {
          frameOptions: { override: true, frameOption },
          referrerPolicy: { referrerPolicy, override: true },
          xssProtection: { modeBlock: true, protection: true, override: true },
          contentTypeOptions: { override: true },
          strictTransportSecurity: {
            accessControlMaxAge: Duration.seconds(31536000),
            override: true,
          },
        },
        customHeadersBehavior: {
          customHeaders: [
            {
              header: 'Cache-Control',
              value: 'private,no-transform,max-age: 3600',
              override: false,
            },
          ],
        },
      },
    );
    
    /**
     * Requests to Cf
     * These policies determine what
     * parts of the client's request are forwarded
     * from CloudFront to your origin.
     * assets/*
     */
    const imgBehavior: BehaviorOptions = {
      responseHeadersPolicy: imgResponse,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: imgRequest,
      cachePolicy: imgCache,
      origin: imgOrigin,
      compress: true,
      functionAssociations: [
        {
          eventType: FunctionEventType.VIEWER_REQUEST,
          function: stripAssetsFunc,
        },
      ],
    };
    
    /**
     * assets/*.gif
     */
    const gifBehavior: BehaviorOptions = {
      responseHeadersPolicy: gifResponse,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: gifRequest,
      cachePolicy: gifCache,
      origin: gifOrigin,
      compress: true,
      functionAssociations: [
        {
          eventType: FunctionEventType.VIEWER_REQUEST,
          function: stripAssetsFunc,
        },
      ],
    };
    
    /**
     * _nuxt/*
     */
    const staticBehavior: BehaviorOptions = {
      responseHeadersPolicy: staticResponse,
      cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: staticRequest,
      cachePolicy: staticCache,
      origin: staticOrigin,
      compress: true,
    };
    
    /**
     * Root
     */
    const ssrBehavior: BehaviorOptions = {
      responseHeadersPolicy: ssrResponse,
      cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: ssrRequest,
      cachePolicy: ssrCache,
      origin: ssrOrigin,
      compress: true,
    };
    
    /**
     * CDN
     */
    const cdn = new Distribution(
      this, 'Cdn', {
        logBucket: logs,
        enableLogging: true,
        logFilePrefix: 'cdn/',
        httpVersion: HttpVersion.HTTP2_AND_3,
        defaultBehavior: ssrBehavior,
        additionalBehaviors: {
          '/fonts/*': staticBehavior,
          '/assets/*': imgBehavior,
          '/assets/*.gif': gifBehavior,
          '/favicon.png': staticBehavior,
          '/api/_content/cache.*': staticBehavior,
          'apple-touch-icon.png': staticBehavior,
          '/favicon.ico': staticBehavior,
          '/_nuxt/*': staticBehavior,
          '/css/*': staticBehavior,
        },
      },
    );
    
    /**
     * Invalidate
     */
    const date = Date.now();
    const distroId = cdn.distributionId;
    const physicalId = PhysicalResourceId.of(`${distroId}-${date}`);
    const invalidator = new AwsCustomResource(
      this, `CloudFrontInvalidation-${date}`, {
        onCreate: {
          action: 'createInvalidation',
          physicalResourceId: physicalId,
          service: 'CloudFront',
          parameters: {
            DistributionId: distroId,
            InvalidationBatch: {
              CallerReference: date.toString(),
              Paths: {
                Quantity: 1,
                Items: [
                  '/*',
                ],
              },
            },
          },
        },
        policy: AwsCustomResourcePolicy.fromSdkCalls({
          resources: AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
      },
    );
    // This sucks...
    invalidator.node.addDependency(
      cdn,
    );
    
    /**
     * Imgix
     */
    const imgixUser = new User(this, 'ImgixUser', { userName: 'imgix' });
    imgixUser.addToPolicy(
      new PolicyStatement({
        resources: [_static.bucketArn],
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
          `${_static.bucketArn}/assets/*`,
        ],
      }),
    );
    
    const accessKey = new CfnAccessKey(
      this, 'ImgixAccessKey', {
        userName: imgixUser.userName,
      },
    );
    
    new CfnOutput(this, 'ContentArn', { value: content.bucketArn });
    new CfnOutput(this, 'SsrLambdaArn', { value: ssr.functionArn });
    new CfnOutput(this, 'SsrLambdaName', { value: ssr.functionName });
    new CfnOutput(this, 'SsrTokenSecretArn', { value: ssrToken.secretArn });
    new CfnOutput(this, 'SsrTokenSecretName', { value: ssrToken.secretName });
    new CfnOutput(this, 'CloudFrontDomainName', { value: cdn.distributionDomainName });
    new CfnOutput(this, 'ImgixSecretAccessKey', { value: accessKey.attrSecretAccessKey });
    new CfnOutput(this, 'StaticBucketDomain', { value: _static.bucketWebsiteDomainName });
    new CfnOutput(this, 'CloudFrontDistributionId', { value: cdn.distributionId });
    new CfnOutput(this, 'StaticBucketName', { value: _static.bucketName });
    new CfnOutput(this, 'StaticBucketArn', { value: _static.bucketArn });
    new CfnOutput(this, 'LogsBucketName', { value: logs.bucketName });
    new CfnOutput(this, 'LogsBucketArn', { value: logs.bucketArn });
    new CfnOutput(this, 'RestApiId', { value: restApi.restApiId });
    new CfnOutput(this, 'RestApiRootUrl', { value: restApi.url });
    new CfnOutput(this, 'ImgixAccessKeyId', {
      value: accessKey.ref,
    });
  }
}
