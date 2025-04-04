import type { Api } from '@stacks/nuxt/api';
import { Construct, ConstructProps } from '@infra/construct';
import { AccessLevel, IOrigin } from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin, S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct as CdkConstruct } from 'constructs';
import type { s3 } from '@stacks/nuxt/s3';
import { Aws } from 'aws-cdk-lib';
import { get } from 'env-var';

export interface OriginProps
extends ConstructProps {
  api: Api
  s3: s3
}

export class Origin extends Construct {
  public readonly img: HttpOrigin;
  public readonly estatica: IOrigin;
  public readonly gif: HttpOrigin;
  public readonly ssr: HttpOrigin;

  constructor(
    scope: CdkConstruct,
    id: string, props: OriginProps,
  ) {
    super(
      scope, id, props,
    );

    const imgixOrigin = get('IMGIX_ORIGIN').required().asString();
    if (!imgixOrigin) {
      throw new Error(
        'imgixOrigin is required',
      );
    }

    this.img = new HttpOrigin(imgixOrigin);
    this.gif = new HttpOrigin(imgixOrigin);
    this.estatica = S3BucketOrigin.withOriginAccessControl(
      props.s3.bucket, {
        originAccessLevels: [
          AccessLevel.READ,
        ],
      },
    );

    const gatewayId = props.api.gateway.restApiId;
    const gatewayHostname = `${gatewayId}.execute-api.${Aws.REGION}.amazonaws.com`;
    this.ssr = new HttpOrigin(
      gatewayHostname, {
        originPath: '/prod',
        customHeaders: {
          'x-origin-token': props.api.tokenResolver,
        },
      },
    );
  }
}
