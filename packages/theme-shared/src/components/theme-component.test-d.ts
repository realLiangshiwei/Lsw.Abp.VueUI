import { describe, expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import type { AbpModalSlots } from '../contracts/modal.js';
import { AbpButton, AbpPagination } from './contract-components.js';
import type { AbpModal } from './contract-components.js';

type ModalProps = InstanceType<typeof AbpModal>['$props'];
type ButtonProps = InstanceType<typeof AbpButton>['$props'];

describe('a contract component', () => {
  it('carries the contract props', () => {
    expectTypeOf<ModalProps['visible']>().toEqualTypeOf<boolean>();
    expectTypeOf<ModalProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | 'xl' | undefined>();
  });

  it('turns each emit into the handler prop Vue expects', () => {
    expectTypeOf<ModalProps['onUpdate:visible']>().toEqualTypeOf<
      ((value: boolean) => void) | undefined
    >();
    expectTypeOf<ButtonProps['onClick']>().toEqualTypeOf<
      ((event: MouseEvent) => void) | undefined
    >();
  });

  it('carries the contract slots', () => {
    expectTypeOf<InstanceType<typeof AbpModal>['$slots']>().toEqualTypeOf<AbpModalSlots>();
  });

  it('still takes the props any component takes', () => {
    expectTypeOf<ModalProps['class']>().not.toBeNever();
    expectTypeOf<ModalProps['key']>().not.toBeNever();
  });

  it('rejects a missing required prop', () => {
    // @ts-expect-error `page`, `pageSize` and `total` have no defaults to fall back on
    h(AbpPagination, { page: 0 });
  });

  it('rejects a value the contract does not allow', () => {
    // @ts-expect-error `xl` is a modal size, not a button size
    h(AbpButton, { size: 'xl' });
  });
});
