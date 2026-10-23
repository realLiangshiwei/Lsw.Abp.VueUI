import { EntityProp, FormProp, PropType } from '@lsw-abpvue/components';
import { expectTypeOf, it } from 'vitest';
import type { TenantActivationState } from '@lsw-abpvue/saas/proxy';
import { createSaasRoutes, provideSaas, SaasComponents, type SaasConfigOptions } from './index.js';

it('infers each contributor record from the official component key', () => {
  const options: SaasConfigOptions = {
    entityPropContributors: {
      [SaasComponents.Tenants]: [
        props =>
          props.addTail(
            EntityProp.create({
              name: 'activation',
              type: PropType.String,
              valueResolver: data => {
                expectTypeOf(data.record.activationState).toEqualTypeOf<TenantActivationState>();
                // @ts-expect-error Editions have tenant counts; tenants do not.
                expectTypeOf(data.record.tenantCount).toBeNumber();
                return data.record.name;
              },
            }),
          ),
      ],
      [SaasComponents.Editions]: [
        props =>
          props.addTail(
            EntityProp.create({
              name: 'tenants',
              type: PropType.Number,
              valueResolver: data => {
                expectTypeOf(data.record.tenantCount).toEqualTypeOf<number>();
                return data.record.tenantCount;
              },
            }),
          ),
      ],
    },
    editFormPropContributors: {
      [SaasComponents.Editions]: [
        props =>
          props.addTail(
            FormProp.create({
              name: 'planId',
              type: PropType.Enum,
              disabled: data => !!data?.record.planId,
            }),
          ),
      ],
    },
    tenantFormValidators: [
      form => (form.get('name')?.value ? null : [{ message: 'required', members: ['name'] }]),
    ],
    tenantFormAsyncValidators: [async () => null],
  };
  createSaasRoutes(options);
  provideSaas(options);
});
