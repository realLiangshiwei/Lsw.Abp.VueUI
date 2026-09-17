import {
  AbpTenantService,
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  LocalizationService,
  ReplaceableComponentsService,
  SessionStateService,
  type ApplicationConfigurationDto,
  type FindTenantResultDto,
  type Injector,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { AccountComponents } from '@lsw-abpvue/account-core';
import { ToasterService } from '@lsw-abpvue/theme-shared';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, type Component } from 'vue';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { provideAbpThemeBasic } from '../../providers/theme-basic.provider.js';
import AbpAuthWrapper from './AbpAuthWrapper.vue';
import AbpTenantBox from './AbpTenantBox.vue';

const page = { template: '<p>the page</p>' };

function tenantsAnswering(result: FindTenantResultDto): ProviderInput {
  return {
    provide: AbpTenantService,
    useValue: {
      findTenantByName: () => Promise.resolve(result),
      findTenantById: () => Promise.resolve(result),
    } as AbpTenantService,
  };
}

/** Refreshing the configuration goes to a backend no unit test has. */
function configStateWithoutBackend(): ProviderInput {
  const real = createInjector([]).get(ConfigStateService);

  return {
    provide: ConfigStateService,
    useValue: {
      ...real,
      refreshAppState: () => Promise.resolve(real.snapshot()),
    } as unknown as ConfigStateService,
  };
}

function configured(injector: Injector, state: Partial<ApplicationConfigurationDto>): void {
  const configState = injector.get(ConfigStateService);
  configState.setState({ ...configState.snapshot(), ...state } as ApplicationConfigurationDto);
}

async function routerAt(path: string, meta: Record<string, unknown> = {}): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/account/login', component: page, meta }],
  });
  await router.push(path);
  await router.isReady();

  return router;
}

async function render(component: Component, injector: Injector, router: Router) {
  const wrapper: VueWrapper = mount(component as never, {
    slots: { default: '<p>the page</p>' },
    attachTo: document.body,
    global: {
      plugins: [router],
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: {
        $t: (key: string, ...params: unknown[]) =>
          injector.get(LocalizationService).t(key, ...params),
      },
    },
  });
  await wrapper.vm.$nextTick();

  return wrapper;
}

describe('AbpAuthWrapper', () => {
  it('puts the page in a card', async () => {
    const injector = createInjector([provideAbpThemeBasic()]);
    const wrapper = await render(AbpAuthWrapper, injector, await routerAt('/account/login'));

    expect(wrapper.find('.card').text()).toContain('the page');
  });

  it('says so instead of showing a form when the client has no login scheme', async () => {
    const injector = createInjector([provideAbpThemeBasic()]);
    configured(injector, { setting: { values: { 'Abp.Account.EnableLocalLogin': 'false' } } });

    const wrapper = await render(AbpAuthWrapper, injector, await routerAt('/account/login'));

    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('the page');
  });

  it('shows no tenant box unless multi-tenancy is on', async () => {
    const injector = createInjector([provideAbpThemeBasic()]);
    const wrapper = await render(AbpAuthWrapper, injector, await routerAt('/account/login'));

    expect(wrapper.findComponent(AbpTenantBox).exists()).toBe(false);
  });

  it('shows the tenant box when multi-tenancy is on', async () => {
    const injector = createInjector([provideAbpThemeBasic()]);
    configured(injector, { multiTenancy: { isEnabled: true } });

    const wrapper = await render(AbpAuthWrapper, injector, await routerAt('/account/login'));

    expect(wrapper.findComponent(AbpTenantBox).exists()).toBe(true);
  });

  it('hides the tenant box on a route that says so', async () => {
    const injector = createInjector([provideAbpThemeBasic()]);
    configured(injector, { multiTenancy: { isEnabled: true } });

    const router = await routerAt('/account/login', { tenantBoxVisible: false });
    const wrapper = await render(AbpAuthWrapper, injector, router);

    expect(wrapper.findComponent(AbpTenantBox).exists()).toBe(false);
  });

  it('renders the tenant box a host registered in place of its own', async () => {
    const injector = createInjector([provideAbpThemeBasic()]);
    configured(injector, { multiTenancy: { isEnabled: true } });
    injector.get(ReplaceableComponentsService).add({
      key: AccountComponents.TenantBox,
      component: defineComponent({ template: '<p>my tenant box</p>' }),
    });

    const wrapper = await render(AbpAuthWrapper, injector, await routerAt('/account/login'));

    expect(wrapper.findComponent(AbpTenantBox).exists()).toBe(false);
    expect(wrapper.text()).toContain('my tenant box');
  });
});

describe('AbpTenantBox', () => {
  it('names the tenant that is set, and offers the host when none is', async () => {
    const injector = createInjector([provideAbpThemeBasic(), configStateWithoutBackend()]);
    const wrapper = await render(AbpTenantBox, injector, await routerAt('/account/login'));

    // No localization is loaded in a unit test, so a key resolves to its own last segment.
    expect(wrapper.text()).toContain('NotSelected');

    injector.get(SessionStateService).setTenant({ id: 'id-1', name: 'acme', isAvailable: true });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('acme');
  });

  it('switches to a tenant the backend knows', async () => {
    const injector = createInjector([
      provideAbpThemeBasic(),
      configStateWithoutBackend(),
      tenantsAnswering({ success: true, isActive: true, tenantId: 'id-1', name: 'acme' }),
    ]);
    const wrapper = await render(AbpTenantBox, injector, await routerAt('/account/login'));

    await wrapper.find('#AbpTenantSwitchLink').trigger('click');
    await wrapper.vm.$nextTick();

    const input = document.querySelector<HTMLInputElement>('input[name="tenant"]');
    expect(input).not.toBeNull();
    input?.dispatchEvent(new Event('focus'));

    // The dialog renders into a portal, so the form is driven through the document.
    if (input) {
      input.value = 'acme';
      input.dispatchEvent(new Event('input'));
    }
    await wrapper.vm.$nextTick();

    document.querySelector<HTMLFormElement>('.modal form')?.dispatchEvent(new Event('submit'));
    await new Promise(resolve => setTimeout(resolve));

    expect(injector.get(SessionStateService).getTenant()?.name).toBe('acme');
  });

  it('says the name was not found and leaves the tenant alone', async () => {
    const injector = createInjector([
      provideAbpThemeBasic(),
      configStateWithoutBackend(),
      tenantsAnswering({ success: false, isActive: false }),
    ]);
    injector.get(SessionStateService).setTenant({ id: 'id-1', name: 'acme', isAvailable: true });

    const wrapper = await render(AbpTenantBox, injector, await routerAt('/account/login'));

    await wrapper.find('#AbpTenantSwitchLink').trigger('click');
    await wrapper.vm.$nextTick();

    const input = document.querySelector<HTMLInputElement>('input[name="tenant"]');
    if (input) {
      input.value = 'nope';
      input.dispatchEvent(new Event('input'));
    }
    await wrapper.vm.$nextTick();

    document.querySelector<HTMLFormElement>('.modal form')?.dispatchEvent(new Event('submit'));
    await new Promise(resolve => setTimeout(resolve));

    expect(injector.get(SessionStateService).getTenant()?.name).toBe('acme');
    expect(injector.get(ToasterService).toasts.value).toHaveLength(1);
  });
});
