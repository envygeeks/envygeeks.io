import type { Origin } from '@stacks/nuxt/cdn/origin';
import type { Cache } from '@stacks/nuxt/cdn/policies/cache';
import type { Request } from '@stacks/nuxt/cdn/policies/request';
import { Construct, ConstructProps } from '@infra/construct';
import type { Resp } from '@stacks/nuxt/cdn/policies/resp';
import { Construct as CdkConstruct } from 'constructs';
import { CachedMethods, Function, FunctionCode } from 'aws-cdk-lib/aws-cloudfront';
import {
  AllowedMethods,
  ViewerProtocolPolicy,
  FunctionEventType,
  BehaviorOptions,
} from 'aws-cdk-lib/aws-cloudfront';

export interface BehaviorProps
extends ConstructProps {
  origin: Origin
  request: Request
  cache: Cache
  resp: Resp
}

export class Behaviors extends Construct {
  public readonly img: BehaviorOptions;
  public readonly gif: BehaviorOptions;
  public readonly estatica: BehaviorOptions;
  public readonly ssr: BehaviorOptions;

  constructor(
    scope: CdkConstruct,
    id: string, props: BehaviorProps,
  ) {
    super(
      scope, id, props,
    );

    const stripAssetsFunc = new Function(
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

    this.img = {
      responseHeadersPolicy: props.resp.img,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: props.request.img,
      cachePolicy: props.cache.img,
      origin: props.origin.img,
      compress: true,
      functionAssociations: [
        {
          eventType: FunctionEventType.VIEWER_REQUEST,
          function: stripAssetsFunc,
        },
      ],
    };

    this.gif = {
      responseHeadersPolicy: props.resp.gif,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: props.request.gif,
      cachePolicy: props.cache.gif,
      origin: props.origin.gif,
      compress: true,
      functionAssociations: [
        {
          eventType: FunctionEventType.VIEWER_REQUEST,
          function: stripAssetsFunc,
        },
      ],
    };

    this.estatica = {
      responseHeadersPolicy: props.resp.estatica,
      cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: props.request.estatica,
      cachePolicy: props.cache.estatica,
      origin: props.origin.estatica,
      compress: true,
    };

    this.ssr = {
      responseHeadersPolicy: props.resp.ssr,
      cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: props.request.ssr,
      cachePolicy: props.cache.ssr,
      origin: props.origin.ssr,
      compress: true,
    };
  }
}
