import { CfnOutput, DockerImage } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export type Env = typeof Envs[number];
export type App = string;
export const Envs = [
  'dev', 'prod', 'global',
] as const;

export const TARGET_NODE_VERSION = Runtime.NODEJS_18_X;
export const DOCKER_IMAGE = 'public.ecr.aws/sam/asset-nodejs18.x:latest-arm64';
export const DOCKER_ASSET = DockerImage.fromRegistry(
  DOCKER_IMAGE,
);

/**
 * {RemoteGetProps} is for
 * {Remote.get} allowing you to specify
 * the env if your current scope
 * is different
 */
export interface RemoteGetProps {
  env?: Env
}

/**
 * {RemoteSetProps} is for
 * {Remote.set}, right now it really
 * only takes a value
 */
export interface RemoteSetProps {
  value: string
}

/**
 * Remote operates on the AWS
 * account, mostly within SSM and getting
 * and setting CDK vals via the
 * AWS API
 */
export class Remote {
  static readonly globalPrefix = '/cdk/global';

  /**
   */
  private static hasEnv(scope: unknown):
    scope is {
      env: string
    } {
    type record = Record<string, unknown>;
    const typedScope = scope as record;
    return (
      typeof typedScope === 'object'
      && typedScope !== null && 'env' in typedScope
      && typeof typedScope.env === 'string'
    );
  }

  /**
   */
  private static idToKey(id: string): string {
    return id
      .split(/(?=[A-Z])/)
      .map(v => v.toLowerCase())
      .join('-');
  }

  /**
   */
  private static prefixFor(
    scope: Construct,
    env?: Env,
  ): string {
    let prefix = this.globalPrefix;
    if (!env && this.hasEnv(scope)) prefix = `/cdk/${scope.env}`;
    if (env) prefix = `/cdk/${env}`;
    return prefix;
  }

  /**
   */
  private static keyFor(
    scope: Construct,
    id: string, env?: Env,
  ): string {
    const key = this.idToKey(id);
    const prefix = this.prefixFor(scope, env);
    return `${prefix}/${key}`;
  }

  /**
   */
  static get(
    scope: Construct,
    id: string, props: RemoteGetProps,
  ): string {
    const key = this.keyFor(scope, id, props.env);
    return StringParameter.valueForStringParameter(
      scope, key,
    );
  }

  /**
   */
  static set(
    scope: Construct,
    id: string, props: RemoteSetProps,
  ): void {
    const paramId = `Remote-${id}`;
    const key = this.keyFor(scope, id);
    new StringParameter(
      scope, paramId, {
        stringValue: props.value,
        parameterName: key,
      },
    );
  }

  /**
   */
  static setAndLog(
    scope: Construct,
    id: string, props: RemoteSetProps,
  ): void {
    this.set(scope, id, { value: props.value });
    new CfnOutput(
      scope, id, {
        value: props.value,
      },
    );
  }
}
