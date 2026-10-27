export interface AbpCookieConsentOptions {
  isEnabled?: boolean | undefined;
  cookiePolicyUrl?: string | undefined;
  privacyPolicyUrl?: string | undefined;
  expireDate?: Date | undefined;
}

export interface GdprFeature {
  readonly options: AbpCookieConsentOptions;
}
