import * as fs from 'node:fs';
import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { execSync } from 'node:child_process';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as agw from 'aws-cdk-lib/aws-apigateway';
import * as agw2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as scm from 'aws-cdk-lib/aws-secretsmanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as lambda  from 'aws-cdk-lib/aws-lambda';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import type { Stage } from './stage';
import * as path from 'node:path';
import { get } from 'env-var';

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
export class Nuxt extends cdk.Stack {
  constructor (
    scope: Construct,
    id: string, props?: cdk.StackProps
  ) {
    super(scope, id, props);
    const self = this;
    const stage = (
      scope as Stage
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
    const logs = new s3.Bucket(this, 'Logs', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });
    
    new cdk.CfnOutput(
      this, 'LogsName', {
        value: logs.bucketName,
      }
    )
    
    new cdk.CfnOutput(
      this, 'LogsArn', {
        value: logs.bucketArn,
      }
    )
    
    /**
     * Static
     */
    const _static = new s3.Bucket(
      this, 'Static', {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        autoDeleteObjects: false,
      },
    );
    
    new cdk.CfnOutput(
      this, 'StaticName', {
        value: _static.bucketName,
      }
    )
    
    new cdk.CfnOutput(
      this, 'StaticArn', {
        value: _static.bucketArn,
      }
    )
    
    /**
     * Content
     */
    const content = new s3.Bucket(
      this, 'Content', {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        autoDeleteObjects: false,
      },
    );
    
    new cdk.CfnOutput(
      this, 'ContentName', {
        value: content.bucketName,
      }
    )
    
    new cdk.CfnOutput(
      this, 'ContentArn', {
        value: content.bucketArn,
      }
    )
    
    /**
     * Proxy Logs
     * RestAPI
     * HttpAPI
     */
    const gatewayLogGroup = new LogGroup(
      this, 'GatewayLogs', {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
    );
    
    new cdk.CfnOutput(
      this, 'GatewayLogGroupName', {
        value: gatewayLogGroup.logGroupName,
      }
    )
    
    /**
     * SSR
     */
    const imgName = 'public.ecr.aws/sam/build-nodejs18.x';
    const backupImg = cdk.DockerImage.fromRegistry(
      imgName,
    );
    
    /**
     * Main Lambda layer
     */
    const ssrCode = lambda.Code.fromAsset(
      this.root, {
        assetHashType: cdk.AssetHashType.SOURCE,
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
                const server = path.join(self.root, 'app/.output/server');
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
    const ssrDepsCode = lambda.Code.fromAsset(
      this.root, {
        assetHashType: cdk.AssetHashType.SOURCE,
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
                  self.root, 'app/.dep/server/node_modules'
                );

                const destModules = path.join(
                  dest, 'node_modules'
                );
                
                execSync(`${_var} pnpm --filter=app cleanup`, io);
                execSync(`${_var} pnpm --filter=app build:${stage.env}`, io);
                fs.mkdirSync(destModules)
                fs.cpSync(
                  path.join(nodeModules),
                  destModules, {
                    recursive: true,
                  }
                );
                
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
    
    const ssrDeps = new lambda.LayerVersion(
      this, 'SsrDepsLayer', {
        code: ssrDepsCode,
        compatibleRuntimes: [
          lambda.Runtime.NODEJS_18_X
        ],
      },
    );
    
    const ssr = new lambda.Function(
      this, 'Ssr', {
        handler: 'index.handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        timeout: cdk.Duration.seconds(10),
        tracing: lambda.Tracing.ACTIVE,
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
    
    new cdk.CfnOutput(
      this, 'SsrFunctionName', {
        value: ssr.functionName,
      }
    )
    
    new cdk.CfnOutput(
      this, 'SsrFunctionArn', {
        value: ssr.functionArn,
      }
    )
    
    /**
     * Sync Static
     */
    const deploy = new s3Deployment.BucketDeployment(
      this, 'Sync', {
        destinationBucket: _static,
        memoryLimit: 1024,
        sources: [
          s3Deployment.Source.asset(
            path.join(this.root, 'app/.output/public')
          ),
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
    const ssrToken = new scm.Secret(this, 'SsrToken', {
      generateSecretString: {
        excludePunctuation: true,
        generateStringKey: 'value',
        secretStringTemplate: JSON.stringify({
          key: 'origin-token',
        }),
      },
    });
    
    const ssrTokenResolver = cdk.Fn.join('', [
      '{{resolve:secretsmanager:', ssrToken.secretName, ':SecretString:value}}'
    ])
    
    new cdk.CfnOutput(
      this, 'SsrTokenName', {
        value: ssrToken.secretName,
      }
    )
    
    /**
     * SSR Authorizer
     * The generic authorizer for RestApi
     * to verify that the header token matches
     * the stored token on our side
     */
    const ssrAuthorizer = new lambda.Function(
      this, 'SsrAuthorizer', {
        handler: 'index.handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: cdk.Duration.seconds(5),
        tracing: lambda.Tracing.ACTIVE,
        memorySize: 128,
        code: lambda.Code.fromAsset(
          path.join(
            this.cdkRoot, 'lambda/authorizer'
          )
        ),
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
    
    new cdk.CfnOutput(
      this, 'SsrAuthorizerFunctionName', {
        value: ssrAuthorizer.functionName,
      }
    )
    
    new cdk.CfnOutput(
      this, 'SsrAuthorizerFunctionArn', {
        value: ssrAuthorizer.functionArn,
      }
    )
    
    /**
     * RestApi Authorizer
     * Used by RestApi to verify the
     * request with a token
     */
    const restAuthorizer = new agw.TokenAuthorizer(
      this, 'RestAuthorizer', {
        resultsCacheTtl: cdk.Duration.minutes(1),
        identitySource: 'method.request.header.x-origin-token',
        handler: ssrAuthorizer,
      },
    );
    
    /**
     * RestApi Integration
     */
    const restIntegration = new agw.LambdaIntegration(
      ssr,
    );
    
    /**
     * RestApi
     */
    const restApiStageName = 'prod';
    const logGroupDestination = new agw.LogGroupLogDestination(gatewayLogGroup);
    const restApi = new agw.RestApi(
      this, 'RestApi', {
        minCompressionSize: cdk.Size.bytes(100),
        endpointTypes: [agw2.EndpointType.REGIONAL],
        binaryMediaTypes: ['*/*'],
        deployOptions: {
          dataTraceEnabled: true,
          accessLogFormat: agw.AccessLogFormat.jsonWithStandardFields(),
          accessLogDestination: logGroupDestination,
          loggingLevel: agw.MethodLoggingLevel.INFO,
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
    
    new cdk.CfnOutput(
      this, 'RestApiId', {
        value: restApi.restApiId,
      }
    )
    
    /**
     * Cdn
     */
    const gatewayId = restApi.restApiId;
    const gatewayHostname = `${gatewayId}.execute-api.${this.region}.amazonaws.com`;
    const stripAssetsFunc = new cf.Function(
      this, 'RewriteAssetsFunction', {
        code: cf.FunctionCode.fromInline(`
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
    
    new cdk.CfnOutput(
      this, 'StripAssetsFunctionName', {
        value: stripAssetsFunc.functionName,
      }
    )
    
    new cdk.CfnOutput(
      this, 'StripAssetsFunctionArn', {
        value: stripAssetsFunc.functionArn,
      }
    )

    /**
     * Origins
     */
    const imgOrigin = new origins.HttpOrigin(imgixOrigin!);
    const gifOrigin = new origins.HttpOrigin(imgixOrigin!);
    const staticOrigin = origins.S3BucketOrigin.withOriginAccessControl(
      _static, {
        originAccessLevels: [
          cf.AccessLevel.READ,
        ],
      },
    );
    
    const ssrOrigin = new origins.HttpOrigin(
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
    const imgCache = new cf.CachePolicy(
      this, 'ImgCache', {
        maxTtl: cdk.Duration.days(365),
        cookieBehavior: cf.OriginRequestCookieBehavior.none(),
        defaultTtl: cdk.Duration.days(1), minTtl: cdk.Duration.seconds(0),
        queryStringBehavior: cf.OriginRequestQueryStringBehavior.all(),
        headerBehavior: cf.OriginRequestHeaderBehavior.allowList(
          'Accept', 'Accept-Language', 'User-Agent',
        ),
      },
    );
    
    new cdk.CfnOutput(
      this, 'ImgCacheId', {
        value: imgCache.cachePolicyId,
      }
    )
    
    /**
     * assets/*.gif
     * Cf Cache
     */
    const gifCache = new cf.CachePolicy(
      this, 'GifCache', {
        maxTtl: cdk.Duration.days(365),
        cookieBehavior: cf.OriginRequestCookieBehavior.none(),
        defaultTtl: cdk.Duration.days(1), minTtl: cdk.Duration.seconds(0),
        queryStringBehavior: cf.OriginRequestQueryStringBehavior.none(),
        headerBehavior: cf.OriginRequestHeaderBehavior.allowList(
          'Accept', 'Accept-Language', 'User-Agent',
        ),
      },
    );
    
    new cdk.CfnOutput(
      this, 'GifCacheId', {
        value: gifCache.cachePolicyId,
      }
    )
    
    /**
     * _nuxt/*
     * Cf Cache
     */
    const staticCache = new cf.CachePolicy(
      this, 'StaticCache', {
        maxTtl: cdk.Duration.days(365),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
        cookieBehavior: cf.OriginRequestCookieBehavior.none(),
        defaultTtl: cdk.Duration.days(1), minTtl: cdk.Duration.seconds(0),
        queryStringBehavior: cf.OriginRequestQueryStringBehavior.none(),
        headerBehavior: cf.OriginRequestHeaderBehavior.allowList(
          'Accept', 'Accept-Language', 'User-Agent',
        ),
      },
    );
    
    new cdk.CfnOutput(
      this, 'StaticCacheId', {
        value: staticCache.cachePolicyId,
      }
    )
    
    /**
     * Root
     * Cf Cache
     */
    const ssrCache = new cf.CachePolicy(
      this, 'SsrCache', {
        enableAcceptEncodingBrotli: true,
        cookieBehavior: cf.OriginRequestCookieBehavior.none(),
        defaultTtl: cdk.Duration.days(1), minTtl: cdk.Duration.seconds(0),
        queryStringBehavior: cf.OriginRequestQueryStringBehavior.none(),
        headerBehavior: cf.OriginRequestHeaderBehavior.none(),
        enableAcceptEncodingGzip: true,
        maxTtl: cdk.Duration.days(365),
      },
    );
    
    new cdk.CfnOutput(
      this, 'SsrCacheId', {
        value: ssrCache.cachePolicyId,
      }
    )
    
    /**
     * Origin Requests
     * These policies control what parts
     * of the client’s request (such as cookies,
     * query strings, and headers) are sent from
     * CloudFront to your origin.
     * assets/*
     */
    const imgRequest = new cf.OriginRequestPolicy(
      this, 'ImgRequest', {
        cookieBehavior: cf.OriginRequestCookieBehavior.none(),
        queryStringBehavior: cf.OriginRequestQueryStringBehavior.all(),
        headerBehavior: cf.OriginRequestHeaderBehavior.none(),
      },
    );
    
    new cdk.CfnOutput(
      this, 'ImgRequestId', {
        value: imgRequest.originRequestPolicyId,
      }
    )
    
    /**
     * assets/*.gif
     */
    const gifRequest = new cf.OriginRequestPolicy(
      this, 'GifRequest', {
        cookieBehavior: cf.OriginRequestCookieBehavior.none(),
        queryStringBehavior: cf.OriginRequestQueryStringBehavior.none(),
        headerBehavior: cf.OriginRequestHeaderBehavior.none(),
      },
    );
    
    new cdk.CfnOutput(
      this, 'GifRequestId', {
        value: gifRequest.originRequestPolicyId,
      }
    )
    
    /**
     * Root
     */
    const ssrRequest = new cf.OriginRequestPolicy(
      this, 'SsrRequest', {
        cookieBehavior: cf.OriginRequestCookieBehavior.all(),
        queryStringBehavior: cf.OriginRequestQueryStringBehavior.all(),
        headerBehavior: cf.OriginRequestHeaderBehavior.allowList(
          'Accept',
          'Accept-Language',
          'CloudFront-Forwarded-Proto',
          'X-Forwarded-For',
          'User-Agent',
          'Via',
        ),
      },
    );
    
    new cdk.CfnOutput(
      this, 'SsrRequestId', {
        value: ssrRequest.originRequestPolicyId,
      }
    )
    
    /**
     * _nuxt/*
     */
    const staticRequest = new cf.OriginRequestPolicy(
      this, 'StaticRequest', {
        cookieBehavior: cf.OriginRequestCookieBehavior.none(),
        queryStringBehavior: cf.OriginRequestQueryStringBehavior.none(),
        headerBehavior: cf.OriginRequestHeaderBehavior.none(),
      },
    );
    
    new cdk.CfnOutput(
      this, 'StaticRequestId', {
        value: staticRequest.originRequestPolicyId,
      }
    )
    
    // Shared Policy Identifiers
    const frameOption = cf.HeadersFrameOption.SAMEORIGIN;
    const accessControlMaxAge = cdk.Duration.seconds(31536000);
    const referrerPolicy = cf.HeadersReferrerPolicy
      .STRICT_ORIGIN_WHEN_CROSS_ORIGIN;
    
    const imgResponse = new cf.ResponseHeadersPolicy(
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
    
    new cdk.CfnOutput(
      this, 'ImgResponseId', {
        value: imgResponse.responseHeadersPolicyId,
      }
    )
    
    const gifResponse = new cf.ResponseHeadersPolicy(
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
    
    new cdk.CfnOutput(
      this, 'GifResponseId', {
        value: gifResponse.responseHeadersPolicyId,
      }
    )
    
    const staticResponse = new cf.ResponseHeadersPolicy(
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
    
    new cdk.CfnOutput(
      this, 'StaticResponseId', {
        value: staticResponse.responseHeadersPolicyId,
      }
    )
    
    /**
     * Root
     */
    const ssrResponse = new cf.ResponseHeadersPolicy(
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
            accessControlMaxAge: cdk.Duration.seconds(31536000),
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
    
    new cdk.CfnOutput(
      this, 'SsrResponseId', {
        value: ssrResponse.responseHeadersPolicyId,
      }
    )
    
    /**
     * Requests to Cf
     * These policies determine what
     * parts of the client's request are forwarded
     * from CloudFront to your origin.
     * assets/*
     */
    const imgBehavior: cf.BehaviorOptions = {
      responseHeadersPolicy: imgResponse,
      allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: imgRequest,
      cachePolicy: imgCache,
      origin: imgOrigin,
      compress: true,
      functionAssociations: [
        {
          eventType: cf.FunctionEventType.VIEWER_REQUEST,
          function: stripAssetsFunc,
        },
      ],
    };
    
    /**
     * assets/*.gif
     */
    const gifBehavior: cf.BehaviorOptions = {
      responseHeadersPolicy: gifResponse,
      allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: gifRequest,
      cachePolicy: gifCache,
      origin: gifOrigin,
      compress: true,
      functionAssociations: [
        {
          eventType: cf.FunctionEventType.VIEWER_REQUEST,
          function: stripAssetsFunc,
        },
      ],
    };
    
    /**
     * _nuxt/*
     */
    const staticBehavior: cf.BehaviorOptions = {
      responseHeadersPolicy: staticResponse,
      cachedMethods: cf.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: staticRequest,
      cachePolicy: staticCache,
      origin: staticOrigin,
      compress: true,
    };
    
    /**
     * Root
     */
    const ssrBehavior: cf.BehaviorOptions = {
      responseHeadersPolicy: ssrResponse,
      cachedMethods: cf.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: ssrRequest,
      cachePolicy: ssrCache,
      origin: ssrOrigin,
      compress: true,
    };
    
    /**
     * HostedZone
     *   Used for validation of
     *   certificates and adding the
     *   routes for the CDN
     */
    const zoneName = get('ZONE_NAME').required().asString();
    const hostedZone = route53.HostedZone.fromLookup(
      this, 'HostedZone', {
        domainName: zoneName
      }
    );
    
    /**
     * Cert Validation
     */
    let certValidation = acm
      .CertificateValidation
      .fromDns(
        hostedZone
      )
    
    /**
     * Certificate
     */
    let domain = get('DOMAIN').required().asString();
    const certificate = new acm.Certificate(
      this, `DevCertificate`, {
        validation: certValidation,
        domainName: domain,
      }
    );
    
    /**
     * CDN
     */
    const cdn = new cf.Distribution(
      this, 'Cdn', {
        logBucket: logs,
        enableLogging: true,
        logFilePrefix: 'cdn/',
        httpVersion: cf.HttpVersion.HTTP2_AND_3,
        defaultBehavior: ssrBehavior,
        certificate: certificate,
        domainNames: [domain],
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
    
    new cdk.CfnOutput(
      this, 'CdnDomainName', {
        value: cdn.domainName,
      }
    )
    
    new cdk.CfnOutput(
      this, 'CdnDistributionId', {
        value: cdn.distributionId,
      }
    )
    
    new cdk.CfnOutput(
      this, 'CdnDistributionArn', {
        value: cdn.distributionArn,
      }
    )
    
    /**
     * CDN Alias
     */
    new route53.ARecord(
      this, 'CdnRecord', {
        zone: hostedZone,
        recordName: domain,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(cdn) // Use the appropriate target
        ),
      }
    );
    
    /**
     * Invalidate
     */
    const date = Date.now();
    const distroId = cdn.distributionId;
    const physicalId = cr.PhysicalResourceId.of(`${distroId}-${date}`);
    const invalidator = new cr.AwsCustomResource(
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
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
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
    const imgixUser = new iam.User(
      this, 'ImgixUser', {
        userName: 'imgix'
      }
    );
    
    new cdk.CfnOutput(
      this, 'ImgixUserName', {
        value: imgixUser.userName,
      }
    )
    
    new cdk.CfnOutput(
      this, 'ImgixUserArn', {
        value: imgixUser.userArn,
      }
    )
    
    /**
     * Scope out Imgix user permissions
     *   even though we have little risk
     *   for assets that are technically
     *   public!
     */
    imgixUser.addToPolicy(
      new iam.PolicyStatement({
        resources: [_static.bucketArn],
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
          `${_static.bucketArn}/assets/*`,
        ],
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
  
  /**
   * Resolves and returns
   * the root directory path for
   * the CDK app
   */
  private get cdkRoot() {
    return path.join(
      __dirname, '..'
    );
  }
  
  /**
   * Resolves and returns
   * the absolute path to the root
   * directory of the monorepo
   * project.
   */
  private get root() {
    return path.join(
      __dirname, '..', '..'
    );
  }
  
  /**
   * Generates and returns a
   * unique hash for the assets
   * managed by the project.
   */
  private get assetHash(): string {
    return execSync(
      `git ls-files -s app | git hash-object --stdin`, {
        encoding: 'utf8', cwd: this.root,
      }
    ).trim();
  }
}
