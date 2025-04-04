import { Construct as CdkConstruct } from 'constructs';
import { Construct, ConstructProps } from '@infra/construct';
import {
  OriginRequestCookieBehavior,
  OriginRequestQueryStringBehavior,
  OriginRequestHeaderBehavior,
  OriginRequestPolicy,
} from 'aws-cdk-lib/aws-cloudfront';

export class Request extends Construct {
  public readonly img: OriginRequestPolicy;
  public readonly gif: OriginRequestPolicy;
  public readonly estatica: OriginRequestPolicy;
  public readonly ssr: OriginRequestPolicy;

  constructor(
    scope: CdkConstruct,
    id: string, props: ConstructProps,
  ) {
    super(
      scope, id, props,
    );

    this.img = new OriginRequestPolicy(
      this, 'ImgRequest', {
        cookieBehavior: OriginRequestCookieBehavior.none(),
        queryStringBehavior: OriginRequestQueryStringBehavior.all(),
        headerBehavior: OriginRequestHeaderBehavior.none(),
      },
    );

    this.gif = new OriginRequestPolicy(
      this, 'GifRequest', {
        cookieBehavior: OriginRequestCookieBehavior.none(),
        queryStringBehavior: OriginRequestQueryStringBehavior.none(),
        headerBehavior: OriginRequestHeaderBehavior.none(),
      },
    );

    this.ssr = new OriginRequestPolicy(
      scope, 'SsrRequest', {
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

    this.estatica = new OriginRequestPolicy(
      scope, 'StaticRequest', {
        cookieBehavior: OriginRequestCookieBehavior.none(),
        queryStringBehavior: OriginRequestQueryStringBehavior.none(),
        headerBehavior: OriginRequestHeaderBehavior.none(),
      },
    );
  }
}
