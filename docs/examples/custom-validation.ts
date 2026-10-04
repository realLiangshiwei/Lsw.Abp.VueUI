import { useAbpForm, Validators, type AbpValidator } from '@lsw-abpvue/theme-shared';

export const acceptTerms: AbpValidator<boolean> = value =>
  value === true
    ? null
    : {
        rule: 'acceptTerms',
        key: { key: 'BookStore::AcceptTerms', defaultValue: 'Accept the terms before continuing.' },
        params: [],
      };

export const companyWhenBusiness: AbpValidator<string> = (value, context) => {
  if (context.valueOf('business') !== true || value.trim()) return null;
  return {
    rule: 'company',
    key: {
      key: 'BookStore::CompanyRequired',
      defaultValue: 'Company is required for a business account.',
    },
    params: [],
  };
};

export function createRegistrationForm() {
  return useAbpForm({
    business: { value: false },
    company: { value: '', validators: [companyWhenBusiness, Validators.maxLength(128)] },
    accepted: { value: false, validators: [acceptTerms] },
    password: { value: '', validators: [Validators.required(), Validators.minLength(8)] },
    confirmation: { value: '', validators: [Validators.compare('password')] },
  });
}
