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
export type GlobalEnv = "global";
export type Env = typeof Envs[number];
export type App = string;
