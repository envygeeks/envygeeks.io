import { Construct } from 'constructs';
import * as records from '../dns.json';
import * as iam from "aws-cdk-lib/aws-iam";
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as stack from '../lib/stack';
import * as cdk from 'aws-cdk-lib';
import { get } from 'env-var';

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

export class HostedZone extends stack.Stack {
  public hostedZone: route53.PublicHostedZone
  
  /**
   * Delegate -> hostedZone
   * The HostedZone id on in AWS
   *   helps you determine which zone
   *   you are working with
   */
  get hostedZoneId (): string {
    return this.hostedZone.hostedZoneId
  }
  
  /**
   * Delegate -> hostedZone
   * The hostedZone name servers so you
   *   can repoint your domain
   */
  get hostedZoneNameServers (): string[]|undefined {
    return this.hostedZone.hostedZoneNameServers
  }
  
  /**
   * Delegate -> hostedZone
   *   The full ARN of the hosted zone
   *   so you can use it in AWS API Calls
   *   when you need to
   */
  get hostedZoneArn ():string {
    return this.hostedZone.hostedZoneArn
  }
  
  /**
   * IF YOUR DOMAIN STOPS WORKING:
   *   When it comes to DNS Sec, there is on that
   *   will need to go to your principal registrar
   *   and then one that will need to be manually
   *   added to your root zone on Route 53 as a
   *   DS Record with the DS Record value
   */
  constructor (
    scope: Construct,
    id: string, props?: stack.StackProps
  ) {
    super(scope, id, props);
    
    /**
     * Prod Hosted Zone
     * Route53
     */
    const zoneName = get('ZONE_NAME').required().asString();
    this.hostedZone = new route53.PublicHostedZone(
      this, 'HostedZone', {
        addTrailingDot: true,
        zoneName: zoneName,
        caaAmazon: true,
      },
    );
    
    new cdk.CfnOutput(
      this, 'HostedZoneId', {
        value: this.hostedZone.hostedZoneId,
      },
    );
    
    new cdk.CfnOutput(
      this, 'HostedZoneArn', {
        value: this.hostedZone.hostedZoneArn,
      },
    );
    
    new cdk.CfnOutput(
      this, 'HostedZoneNameServers', {
        value: cdk.Fn.join(
          ', ', this.hostedZoneNameServers as unknown as string[]
        )
      }
    )
    
    /**
     * DNSSec
     */
    const dnsKey = new kms.Key(
      this, 'DnsKey', {
        enableKeyRotation: false,
        keySpec: kms.KeySpec.ECC_NIST_P256,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        keyUsage: kms.KeyUsage.SIGN_VERIFY,
        alias: 'Dns/Sec',
      },
    );
    
    new cdk.CfnOutput(this, 'DnsKeyId', {value: dnsKey.keyId})
    new cdk.CfnOutput(this, 'DnsKeyArn', {
      value: dnsKey.keyArn,
    });
    
    dnsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal(
            "dnssec-route53.amazonaws.com",
          ),
        ],
        actions: [
          "kms:DescribeKey",
          "kms:GetPublicKey",
          "kms:Sign",
        ],
        resources: ["*"],
        conditions: {
          "StringEquals": {
            "aws:SourceAccount": cdk.Aws.ACCOUNT_ID,
          },
        },
      }),
    );
    
    dnsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal(
            "dnssec-route53.amazonaws.com",
          ),
        ],
        actions: [
          "kms:CreateGrant",
        ],
        resources: ["*"],
        conditions: {
          "Bool": {"kms:GrantIsForAWSResource": true},
          "StringEquals": {
            "aws:SourceAccount": cdk.Aws.ACCOUNT_ID,
          },
        },
      }),
    );
    
    const signingKey = new route53.KeySigningKey(
      this, 'SigningKey', {
        hostedZone: this.hostedZone,
        status: route53.KeySigningKeyStatus.ACTIVE,
        kmsKey: dnsKey,
      },
    )
    
    new cdk.CfnOutput(
      this, 'SigningKeyName', {
        value: signingKey.keySigningKeyName,
      },
    );
    
    new cdk.CfnOutput(
      this, 'SigningKeyId', {
        value: signingKey.keySigningKeyId,
      },
    );
    
    new route53.CfnDNSSEC(
      this, 'DNSSEC', {
        hostedZoneId: this.hostedZone.hostedZoneId,
      },
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
      const mxRecords: MxRecords = records.mx;
      new route53.MxRecord(this, 'Mx', {
        values: mxRecords, zone: this.hostedZone,
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
        new route53.TxtRecord(this,
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
        new route53.CnameRecord(
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