import { EntityProp, PropType } from '@lsw-abpvue/components';
import type { IdentityUserDto } from '@lsw-abpvue/identity-pro/proxy';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserIdentityCell from './UserIdentityCell.vue';

const record: IdentityUserDto = {
  id: 'other',
  userName: '<strong>unsafe</strong>',
  email: '<img src=x>',
  phoneNumber: '123',
  emailConfirmed: true,
  phoneNumberConfirmed: false,
  supportTwoFactor: true,
  twoFactorEnabled: false,
  isActive: false,
  lockoutEnabled: true,
  isLockedOut: true,
  shouldChangePasswordOnNextLogin: true,
  accessFailedCount: 0,
  isExternal: false,
};

const column = (name: string) =>
  EntityProp.create<IdentityUserDto>({ name, type: PropType.String });

describe('commercial user identity cells', () => {
  it('shows lock and inactive status while escaping the user name', () => {
    const wrapper = mount(UserIdentityCell, {
      props: { record, prop: column('userName') },
      global: { mocks: { $t: (key: string) => key } },
    });
    expect(wrapper.text()).toContain('<strong>unsafe</strong>');
    expect(wrapper.find('strong').exists()).toBe(false);
    expect(wrapper.find('[title="AbpIdentity::ThisUserIsLockedOutMessage"]').exists()).toBe(true);
    expect(wrapper.find('[title="AbpIdentity::ThisUserIsNotActiveMessage"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('renders only the corresponding confirmation marker without parsing markup', () => {
    const options = { global: { mocks: { $t: (key: string) => key } } };
    const email = mount(UserIdentityCell, { ...options, props: { record, prop: column('email') } });
    expect(email.text()).toContain('<img src=x>');
    expect(email.find('img').exists()).toBe(false);
    expect(email.find('[aria-label="AbpIdentity::DisplayName:EmailConfirmed"]').exists()).toBe(
      true,
    );
    const phone = mount(UserIdentityCell, {
      ...options,
      props: { record, prop: column('phoneNumber') },
    });
    expect(phone.text()).toBe('123');
    expect(phone.find('i').exists()).toBe(false);
    email.unmount();
    phone.unmount();
  });
});
