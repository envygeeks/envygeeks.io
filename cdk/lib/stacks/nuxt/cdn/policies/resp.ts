import { Construct, ConstructProps } from '@infra/construct';
import { Duration } from 'aws-cdk-lib';
import { HeadersFrameOption, HeadersReferrerPolicy, ResponseHeadersPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { Construct as CdkConstruct } from 'constructs';

export class Resp extends Construct {
  public readonly img: ResponseHeadersPolicy;
  public readonly gif: ResponseHeadersPolicy;
  public readonly estatica: ResponseHeadersPolicy;
  public readonly ssr: ResponseHeadersPolicy;

  constructor(
    scope: CdkConstruct,
    id: string, props: ConstructProps,
  ) {
    super(
      scope, id, props,
    );

    const frameOption = HeadersFrameOption.SAMEORIGIN;
    const accessControlMaxAge = Duration.seconds(31536000);
    const referrerPolicy = HeadersReferrerPolicy
      .STRICT_ORIGIN_WHEN_CROSS_ORIGIN;

    this.img = new ResponseHeadersPolicy(
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

    this.gif = new ResponseHeadersPolicy(
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

    this.estatica = new ResponseHeadersPolicy(
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

    this.ssr = new ResponseHeadersPolicy(
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
            override: true,
            accessControlMaxAge: Duration
              .seconds(31536000),
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
  }
}
