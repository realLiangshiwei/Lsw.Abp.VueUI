export const defaultApplicationTypes = { public: 'public', confidential: 'confidential' } as const;
export const defaultClientAuthenticationMethods = { secret: 'secret', jwks: 'jwks' } as const;

const options = (values: readonly string[]) => values.map(value => ({ key: value, value }));

export const defaultApplicationsTypeList = options([
  defaultApplicationTypes.confidential,
  defaultApplicationTypes.public,
]);
export const defaultApplicationTypesList = options(['web', 'native']);
export const DefaultApplicationsConsentType = options([
  'explicit',
  'external',
  'implicit',
  'systematic',
]);
