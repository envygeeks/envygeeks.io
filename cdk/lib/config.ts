/**
 * Allowed Regions
 * For: AWS
 */
export const Regions = [
  "us-east-1"
] as const;

/**
 * Allowed Envs
 * For: Cdk
 */
export const Envs = [
  "dev", "prod"
] as const;


/**
 * Interfaces
 */
export type App = string;
export type Env = typeof Envs[number];
export type Region = typeof Regions[
  number
];
