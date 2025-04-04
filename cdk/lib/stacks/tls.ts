import { Construct } from 'constructs';
import { StackProps, Stack } from '@infra/stack';
import { Dns } from '@stacks/dns';
import {
  Certificate,
  CertificateValidation,
} from 'aws-cdk-lib/aws-certificatemanager';
import { Remote } from 'conf';

export const SSM_KEY = 'TlsCertArn';
export interface CertProps
extends StackProps {
  domain: string
  wildcard?: boolean
  dns: Dns
}

export class Tls extends Stack {
  public readonly cert: Certificate;

  /**
   */
  constructor(
    scope: Construct,
    id: string, props: CertProps,
  ) {
    super(
      scope, id, props,
    );

    const {
      domain,
      wildcard,
      dns,
    } = props;

    const validation = CertificateValidation
      .fromDns(
        dns.hostedZone,
      );

    const domainName = wildcard ? `*.${domain}` : domain;
    this.cert = new Certificate(
      this, 'Cert', {
        validation,
        domainName,
      },
    );

    Remote.setAndLog(
      this, SSM_KEY, {
        value: this.cert.certificateArn,
      },
    );
  }
}
