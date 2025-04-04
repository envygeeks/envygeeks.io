import { Stack, type StackProps } from '@infra/stack';
import { Aws, CfnOutput, Fn, RemovalPolicy } from 'aws-cdk-lib';
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key, KeySpec, KeyUsage } from 'aws-cdk-lib/aws-kms';
import {
  CfnDNSSEC,
  CfnKeySigningKey,
  KeySigningKeyStatus,
  TxtRecord as CdkTxtRecord,
  CnameRecord as CdkCnameRecord,
  MxRecord as CdkMxRecord,
  PublicHostedZone,
  KeySigningKey,
} from 'aws-cdk-lib/aws-route53';
import { Remote } from 'conf';
import * as rawRecords from '../../dns.json';
import type { Construct } from 'constructs';
import { get } from 'env-var';

export const SSM_KEY_ARN = 'HostedZoneArn';
export const SSM_KEY_NAME = 'HostedZoneName';
export const SSM_KEY_ID = 'HostedZoneId';

/**
 * @example
 * {
 *   "spf": "v=spf1 ...",
 *   "mx": [
 *     { "hostName": "mail.example.com", "priority": 10 }
 *   ],
 *   "txt": {
 *     "@": [
 *       "key=value",
 *       "v=spf1 ..."
 *     ],
 *     "subdomain": [
 *       "key=value"
 *     ]
 *   },
 *   "cname": [
 *     {
 *       "name": "subdomain",
 *       "value": "target.example.com"
 *     }
 *   ]
 * }
 */
interface DnsConfig {
  mx: MxRecord[]
  cname: CnameRecord[]
  txt: TxtRecords
  spf: string
}

/**
 * @example
 * { "hostName": "mail.example.com", "priority": 10 }
 */
interface MxRecord {
  hostName: string
  priority: number
}

/**
 * @example
 * {
 *   "@": [
 *     "key=value",
 *     "v=spf1 ..."
 *   ],
 *   "subdomain": [
 *     "key=value"
 *   ]
 * }
 */
type TxtRecords = Record<
  string, string[]
>;

/**
 * @example
 * {
 *   "name": "subdomain",
 *   "value": "target.example.com"
 * }
 */
interface CnameRecord {
  name: string
  value: string
}

export class Dns extends Stack {
  public hostedZone: PublicHostedZone;

  constructor(
    scope: Construct,
    id: string, props: StackProps,
  ) {
    super(
      scope, id, props,
    );

    const records = rawRecords as DnsConfig;
    const name = get('ZONE_NAME').required().asString();
    this.hostedZone = new PublicHostedZone(
      this, 'HostedZone', {
        caaAmazon: true,
        addTrailingDot: true,
        zoneName: name,
      },
    );

    Remote.setAndLog(
      this, SSM_KEY_NAME, {
        value: this.hostedZone.zoneName,
      },
    );

    Remote.setAndLog(
      this, SSM_KEY_ID, {
        value: this.hostedZone.hostedZoneId,
      },
    );

    Remote.setAndLog(
      this, SSM_KEY_ARN, {
        value: this.hostedZone.hostedZoneArn,
      },
    );

    new CfnOutput(
      this, 'HostedZoneNameServers', {
        value: Fn.join(
          // It's crazy we have to do this but it's a bug 🤷‍♂️
          ', ', this.hostedZone.hostedZoneNameServers as unknown as string[],
        ),
      },
    );

    const key = new Key(
      this, 'Key', {
        enableKeyRotation: false,
        keySpec: KeySpec.ECC_NIST_P256,
        removalPolicy: RemovalPolicy.DESTROY,
        keyUsage: KeyUsage.SIGN_VERIFY,
        alias: 'Dns/Sec',
      },
    );

    new CfnOutput(this, 'KeyId', { value: key.keyId });
    new CfnOutput(this, 'KeyArn', {
      value: key.keyArn,
    });

    key.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        principals: [
          new ServicePrincipal(
            'dnssec-route53.amazonaws.com',
          ),
        ],
        actions: [
          'kms:DescribeKey',
          'kms:GetPublicKey',
          'kms:Sign',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'aws:SourceAccount': Aws.ACCOUNT_ID,
          },
        },
      }),
    );

    key.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        principals: [
          new ServicePrincipal(
            'dnssec-route53.amazonaws.com',
          ),
        ],
        actions: [
          'kms:CreateGrant',
        ],
        resources: ['*'],
        conditions: {
          Bool: { 'kms:GrantIsForAWSResource': true },
          StringEquals: {
            'aws:SourceAccount': Aws.ACCOUNT_ID,
          },
        },
      }),
    );

    const signingKey = new KeySigningKey(
      this, 'SigningKey', {
        hostedZone: this.hostedZone,
        status: KeySigningKeyStatus.ACTIVE,
        kmsKey: key,
      },
    );

    new CfnOutput(
      this, 'SigningKeyName', {
        value: signingKey.keySigningKeyName,
      },
    );

    new CfnOutput(
      this, 'SigningKeyId', {
        value: signingKey.keySigningKeyId,
      },
    );

    const sec = new CfnDNSSEC(
      this, 'DNSSEC', {
        hostedZoneId: this.hostedZone.hostedZoneId,
      },
    );

    sec.addDependency(
      signingKey.node.defaultChild as CfnKeySigningKey,
    );

    /**
     * dns.json:
     *   {
     *     "mx": [
     *       { "hostName": "mx01.mail.example.com", "priority": 10 },
     *       { "hostName": "mx02.mail.example.com", "priority": 10 }
     *     ],
     *   }
     */
    if (records.mx) {
      new CdkMxRecord(this, 'Mx', {
        values: records.mx, zone: this.hostedZone,
      });
    }

    /**
     * dns.json:
     *   {
     *     "txt": {
     *       "@": [
     *         "hello",
     *         "world"
     *       ]
     *     }
     *   }
     */
    if (records.txt) {
      const txtRecords: TxtRecords = records.txt;
      for (const name in records.txt) {
        const record = name == '@'
          ? {
            values: txtRecords[name],
            zone: this.hostedZone,
          }
          : {
            zone: this.hostedZone,
            values: txtRecords[name],
            name: name,
          };

        /**
         * On Route53 the normal @
         * record should just be empty because
         * it uses the hostname
         */
        new CdkTxtRecord(this,
          `Txt${name}`, record,
        );
      }
    }

    /**
     * dns.json:
     *   {
     *     cname: [
     *       { name: "hello", "value": "example.com" },
     *       { name: "world", "value": "example.com" }
     *     ]
     *   }
     */
    if (records.cname) {
      for (const record of records.cname) {
        new CdkCnameRecord(
          this, `Cname${record.name}`, {
            recordName: record.name,
            domainName: record.value,
            zone: this.hostedZone,
          },
        );
      }
    }
  }
}
