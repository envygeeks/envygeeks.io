import type { Api } from '@stacks/nuxt/api';
import { Origin } from '@stacks/nuxt/cdn/origin';
import { Resp } from '@stacks/nuxt/cdn/policies/resp';
import { Behaviors } from '@stacks/nuxt/cdn/behaviors';
import { Cache } from '@stacks/nuxt/cdn/policies/cache';
import { Construct, ConstructProps } from '@infra/construct';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Distribution, HttpVersion } from 'aws-cdk-lib/aws-cloudfront';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Request } from '@stacks/nuxt/cdn/policies/request';
import { Construct as CdkConstruct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import type { s3 } from '@stacks/nuxt/s3';
import { CfnOutput } from 'aws-cdk-lib';
import { Remote } from 'conf';
import { get } from 'env-var';

import { SSM_KEY as TLS_SSM_KEY } from '@stacks/tls';
import { SSM_KEY_LOGS_ARN as LOGS_SSM_KEY } from '@stacks/s3';
import {
  SSM_KEY_NAME as ZONE_NAME_SSM_KEY,
  SSM_KEY_ID as ZONE_ID_SSM_KEY,
} from '@stacks/dns';

export interface CdnProps
extends ConstructProps {
  api: Api
  s3: s3
}

export class Cdn extends Construct {
  constructor(
    scope: CdkConstruct,
    id: string, props: CdnProps,
  ) {
    super(
      scope, id, props,
    );

    const cachePolicies = new Cache(this, 'CachePolicies', props);
    const requestPolicies = new Request(this, 'RequestPolicies', props);
    const resPolicies = new Resp(this, 'ResPolicies', props);
    const origins = new Origin(this, 'Origins', props);
    const behaviors = new Behaviors(
      this, 'Behaviors', {
        origin: origins,
        cache: cachePolicies,
        request: requestPolicies,
        resp: resPolicies,
        ...props,
      },
    );

    let domain = get('DOMAIN').required().asString();
    const certArn = Remote.get(this, TLS_SSM_KEY, { env: 'global' });
    const logsBucketArn = Remote.get(this, LOGS_SSM_KEY, { env: 'global' });
    const cert = Certificate.fromCertificateArn(this, 'Cert', certArn);
    if ('dev' === this.env) domain = `dev.${domain}`;
    const logsBucket = Bucket.fromBucketArn(
      this, 'LogsBucket', logsBucketArn,
    );

    const cdn = new Distribution(
      this, 'Cdn', {
        enableLogging: true,
        logFilePrefix: 'cdn/',
        logBucket: logsBucket,
        httpVersion: HttpVersion.HTTP2_AND_3,
        defaultBehavior: behaviors.ssr,
        certificate: cert,
        domainNames: [domain],
        additionalBehaviors: {
          '/assets/*': behaviors.img,
          '/fonts/*': behaviors.estatica,
          '/assets/*.gif': behaviors.gif,
          '/favicon.png': behaviors.estatica,
          '/api/_content/cache.*': behaviors.estatica,
          'apple-touch-icon.png': behaviors.estatica,
          '/favicon.ico': behaviors.estatica,
          '/_nuxt/*': behaviors.estatica,
          '/css/*': behaviors.estatica,
        },
      },
    );

    new CfnOutput(
      this, 'CdnDomainName', {
        value: cdn.domainName,
      },
    );

    new CfnOutput(
      this, 'CdnDistributionId', {
        value: cdn.distributionId,
      },
    );

    new CfnOutput(
      this, 'CdnDistributionArn', {
        value: cdn.distributionArn,
      },
    );

    const zoneName = Remote.get(this, ZONE_NAME_SSM_KEY, { env: 'global' });
    const hostedZoneId = Remote.get(this, ZONE_ID_SSM_KEY, { env: 'global' });
    const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId, zoneName,
    });

    new ARecord(
      this, 'CdnRecord', {
        zone: hostedZone,
        recordName: 'dev',
        target: RecordTarget.fromAlias(
          new CloudFrontTarget(cdn),
        ),
      },
    );
  }
}
