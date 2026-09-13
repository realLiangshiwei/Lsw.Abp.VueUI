import {
  ConfigStateService,
  createInjector,
  type ApplicationConfigurationDto,
} from '@lsw-abpvue/core';
import type { ProfileDto } from '@lsw-abpvue/account-core/proxy';
import { defineComponent, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { ManageProfileStateService, ManageProfileTabsService } from './manage-profile.service.js';

const Tab = defineComponent({ render: () => null });

describe('ManageProfileTabsService', () => {
  it('orders the tabs the way the tree orders anything else', () => {
    const tabs = createInjector([]).get(ManageProfileTabsService);
    tabs.add([
      { name: 'second', text: 'Second', component: Tab, order: 2 },
      { name: 'first', text: 'First', component: Tab, order: 1 },
    ]);

    expect(tabs.visible.value.map(tab => tab.name)).toEqual(['first', 'second']);
  });

  it('hides a tab whose policy is not granted', () => {
    const injector = createInjector([]);
    const configState = injector.get(ConfigStateService);
    configState.setState({
      ...configState.snapshot(),
      auth: { grantedPolicies: { 'Abp.Whatever': true } },
    } as ApplicationConfigurationDto);

    const tabs = injector.get(ManageProfileTabsService);
    tabs.add([
      { name: 'allowed', text: 'Allowed', component: Tab, requiredPolicy: 'Abp.Whatever' },
      { name: 'refused', text: 'Refused', component: Tab, requiredPolicy: 'Abp.Other' },
    ]);

    expect(tabs.visible.value.map(tab => tab.name)).toEqual(['allowed']);
  });

  it('re-reads a visibility callback as what it depends on changes', () => {
    const external = ref(true);
    const tabs = createInjector([]).get(ManageProfileTabsService);
    tabs.add([
      { name: 'password', text: 'Password', component: Tab, visible: () => !external.value },
    ]);

    expect(tabs.visible.value).toHaveLength(0);

    external.value = false;
    expect(tabs.visible.value).toHaveLength(1);
  });
});

describe('ManageProfileStateService', () => {
  it('starts with no profile and hands out the one it is given', () => {
    const state = createInjector([]).get(ManageProfileStateService);
    expect(state.profile.value).toBeNull();

    const profile = { userName: 'admin', isExternal: false, hasPassword: true } as ProfileDto;
    state.set(profile);

    expect(state.profile.value?.userName).toBe('admin');
  });
});
