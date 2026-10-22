export interface AccountProOptions {
  appName?: string | undefined;
  hostOrigin?: string | undefined;
  trustedOrigins?: readonly string[] | undefined;
  tenantOrigins?: Readonly<Record<string, string>> | undefined;
  linkReturnPath?: string | undefined;
}
