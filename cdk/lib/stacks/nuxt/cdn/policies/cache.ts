import { Construct, ConstructProps } from '@infra/construct';
import { Construct as CdkConstruct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { CachePolicy,
  OriginRequestCookieBehavior,
  OriginRequestQueryStringBehavior,
  OriginRequestHeaderBehavior,
} from 'aws-cdk-lib/aws-cloudfront';

export class Cache extends Construct {
  public readonly img: CachePolicy;
  public readonly gif: CachePolicy;
  public readonly estatica: CachePolicy;
  public readonly ssr: CachePolicy;

  constructor(
    scope: CdkConstruct,
    id: string, props: ConstructProps,
  ) {
    super(
      scope, id, props,
    );

    this.img = new CachePolicy(
      scope, 'ImgCache', {
        maxTtl: Duration.days(365),
        cookieBehavior: OriginRequestCookieBehavior.none(),
        defaultTtl: Duration.days(1), minTtl: Duration.seconds(0),
        queryStringBehavior: OriginRequestQueryStringBehavior.all(),
        headerBehavior: OriginRequestHeaderBehavior.allowList(
          'Accept', 'Accept-Language', 'User-Agent',
        ),
      },
    );

    this.gif = new CachePolicy(
      scope, 'GifCache', {
        maxTtl: Duration.days(365),
        cookieBehavior: OriginRequestCookieBehavior.none(),
        defaultTtl: Duration.days(1), minTtl: Duration.seconds(0),
        queryStringBehavior: OriginRequestQueryStringBehavior.none(),
        headerBehavior: OriginRequestHeaderBehavior.allowList(
          'Accept', 'Accept-Language', 'User-Agent',
        ),
      },
    );

    this.estatica = new CachePolicy(
      scope, 'StaticCache', {
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

    this.ssr = new CachePolicy(
      scope, 'SsrCache', {
        enableAcceptEncodingBrotli: true,
        cookieBehavior: OriginRequestCookieBehavior.all(),
        defaultTtl: Duration.days(1), minTtl: Duration.seconds(0),
        queryStringBehavior: OriginRequestQueryStringBehavior.all(),
        headerBehavior: OriginRequestHeaderBehavior.none(),
        enableAcceptEncodingGzip: true,
        maxTtl: Duration.days(7),
      },
    );
  }
}
