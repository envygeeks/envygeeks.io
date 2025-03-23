import { Construct } from 'constructs';
import { Aws, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as records from '../dns.json';
import { get } from 'env-var';
import {
  TxtRecord,
  KeySigningKeyStatus,
  MxRecord as CdkMxRecord,
  CnameRecord as CdkCnameRecord,
  PublicHostedZone,
  KeySigningKey,
  CfnDNSSEC,
} from 'aws-cdk-lib/aws-route53';
import {
  Key,
  KeySpec,
  KeyUsage
} from 'aws-cdk-lib/aws-kms';
import {
  Effect,
  PolicyStatement,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';

/**
 * JSON: {
 *   hostname: "mx01.example.com",
 *   priority: 10
 * }
 */
interface MxRecord {
  hostName: string,
  priority: number,
}

/**
 * JSON: {
 *   name: "dev",
 *   value: "cloudfront.com"
 * }
 */
interface CnameRecord {
  name: string,
  value: string
}

/**
 * Types
 */
type MxRecords = MxRecord[];
type CnameRecords = CnameRecord[];
type TxtRecords = Record<
  string, string[]
>;

export class HostedZonesStack extends Stack {
  public prod: PublicHostedZone; public dev: PublicHostedZone;
  
  /**
   * IF YOUR DOMAIN STOPS WORKING:
   *   When it comes to DNS Sec, there is on that
   *   will need to go to your principal registrar
   *   and then one that will need to be manually
   *   added to your root zone on Route 53 as a
   *   DS Record with the DS Record value
   */
  constructor (scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    /**
     * Prod Hosted Zone
     * Route53
     */
    const prodZoneName = get('PROD_ZONE_NAME').required().asString();
    this.prod = new PublicHostedZone(
      this, 'HostedZone', {
        addTrailingDot: true,
        zoneName: prodZoneName,
        caaAmazon: true,
      }
    );
    
    /**
     * DNSSec
     */
    const prodDNSKey = new Key(
      this, 'DNSSecKey', {
        enableKeyRotation: false,
        keySpec: KeySpec.ECC_NIST_P256,
        removalPolicy: RemovalPolicy.DESTROY,
        keyUsage: KeyUsage.SIGN_VERIFY,
        alias: 'Dns/Prod',
      }
    );
    
    prodDNSKey.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        principals: [
          new ServicePrincipal(
            "dnssec-route53.amazonaws.com"
          )
        ],
        actions: [
          "kms:DescribeKey",
          "kms:GetPublicKey",
          "kms:Sign"
        ],
        resources: ["*"],
        conditions: {
          "StringEquals": {
            "aws:SourceAccount": Aws.ACCOUNT_ID
          }
        }
      })
    );
    
    prodDNSKey.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        principals: [
          new ServicePrincipal(
            "dnssec-route53.amazonaws.com"
          )
        ],
        actions: [
          "kms:CreateGrant"
        ],
        resources: ["*"],
        conditions: {
          "Bool": { "kms:GrantIsForAWSResource": true },
          "StringEquals": {
            "aws:SourceAccount": Aws.ACCOUNT_ID
          },
        }
      })
    );
    
    new KeySigningKey(
      this, 'DNSSecSigningKey', {
        kmsKey: prodDNSKey,
        status: KeySigningKeyStatus.ACTIVE,
        hostedZone: this.prod,
      }
    )
    
    new CfnDNSSEC(this, 'DNSSec', {
      hostedZoneId: this.prod.hostedZoneId
    });
    
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
      const mxRecords: MxRecords = records.mx;
      new CdkMxRecord(this, 'Mx', {
        values: mxRecords, zone: this.prod,
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
        const record = name == "@"
          ? {
            values: txtRecords[name],
            zone: this.prod
          }
          : {
            zone: this.prod,
            values: txtRecords[name],
            name: name,
          };
        
        /**
         * On Route53 the normal @
         * record should just be empty because
         * it uses the hostname
         */
        new TxtRecord(this,
          `Txt${name}`, record,
        )
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
      for (const record of records.cname as CnameRecords) {
        new CdkCnameRecord(
          this, `Cname${record.name}`, {
            recordName: record.name,
            domainName: record.value,
            zone: this.prod,
          }
        );
      }
    }
  }
}