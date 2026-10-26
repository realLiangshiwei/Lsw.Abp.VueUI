import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  LocalizationService,
  SessionStateService,
  type ObjectExtensionsDto,
} from '@lsw-abpvue/core';
import { TextTemplateManagementPolicyNames as Policy } from '@lsw-abpvue/text-template-management/config';
import {
  TemplateContentService,
  TemplateDefinitionService,
  type TemplateDefinitionDto,
  type TextTemplateContentDto,
} from '@lsw-abpvue/text-template-management/proxy';
import { EntityProp, PropType, ToolbarAction } from '@lsw-abpvue/components';
import { ToasterService, ValidationErrorService } from '@lsw-abpvue/theme-shared';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, type Component } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { TextTemplateManagementComponents as Keys } from '../enums/components.js';
import { provideTextTemplateManagement } from '../providers/text-template-management.provider.js';
import type { TextTemplateManagementConfigOptions } from '../tokens/extensions.token.js';
import InlineTemplateContentPage from './InlineTemplateContentPage.vue';
import TemplateContentsPage from './TemplateContentsPage.vue';
import TextTemplatesPage from './TextTemplatesPage.vue';

const template: TemplateDefinitionDto = {
  name: 'Example.Welcome',
  displayName: 'Welcome template',
  isLayout: false,
  layout: 'Example.Layout',
  isInlineLocalized: true,
  defaultCultureName: 'en',
  renderEngine: 'Scriban',
  isNotSandboxedEngine: false,
};
const basePath = '/text-template-management/text-templates';
const wrappers: VueWrapper[] = [];
const injectors: ReturnType<typeof createInjector>[] = [];

afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

function deferred<T>() {
  let resolve: ((value: T) => void) | undefined;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve: (value: T) => resolve?.(value) };
}
async function settle(): Promise<void> {
  await flushPromises();
  await nextTick();
}
async function click(view: VueWrapper, label: string): Promise<void> {
  const button = view.findAll('button').find(element => element.text().trim() === label);
  if (!button) throw new TypeError(`No button is labelled ${label}.`);
  await button.trigger('click');
  await settle();
}

async function render(
  component: Component = TemplateContentsPage,
  options: {
    path?: string | undefined;
    definitions?: Partial<TemplateDefinitionService> | undefined;
    contents?: Partial<TemplateContentService> | undefined;
    policies?: string[] | undefined;
    contributions?: TextTemplateManagementConfigOptions | undefined;
    objectExtensions?: ObjectExtensionsDto | undefined;
  } = {},
) {
  const definitions: TemplateDefinitionService = {
    apiName: 'TextTemplateManagement',
    get: vi.fn(async () => template),
    getList: vi.fn(async () => ({ items: [template], totalCount: 1 })),
    ...options.definitions,
  };
  const contents: TemplateContentService = {
    apiName: 'TextTemplateManagement',
    get: vi.fn(async input => ({
      name: input.templateName,
      cultureName: input.cultureName,
      content: `content:${input.cultureName ?? 'inline'}`,
    })),
    update: vi.fn(async input => ({
      name: input.templateName,
      cultureName: input.cultureName,
      content: input.content,
    })),
    restoreToDefault: vi.fn(async () => {}),
    ...options.contents,
  };
  const injector = createInjector([
    ...plainTheme.providers,
    ...provideTextTemplateManagement(options.contributions),
    { provide: TemplateDefinitionService, useValue: definitions },
    { provide: TemplateContentService, useValue: contents },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    currentUser: { ...config.snapshot().currentUser, id: 'operator', isAuthenticated: true },
    auth: {
      grantedPolicies: Object.fromEntries(
        (options.policies ?? Object.values(Policy)).map(policy => [policy, true]),
      ),
    },
    objectExtensions: options.objectExtensions ?? config.snapshot().objectExtensions,
    localization: {
      ...config.snapshot().localization,
      currentCulture: { ...config.snapshot().localization.currentCulture, cultureName: 'fr' },
      languages: [
        { cultureName: 'en', displayName: 'English' },
        { cultureName: 'fr', displayName: 'French' },
        { cultureName: 'de', displayName: 'German' },
      ],
    },
  });
  const localization = injector.get(LocalizationService);
  vi.spyOn(localization, 't').mockImplementation(key => {
    if (key === 'TextTemplateManagement::InlineContentDescription')
      return 'Use <b>{{L "Hello"}}</b>.<br /><a href="https://abp.io/docs/text-templates" target="_blank">Documentation</a><img src=x onerror=alert(1)>';
    return typeof key === 'string' ? key : (key.key ?? '');
  });
  const toast = vi.spyOn(injector.get(ToasterService), 'success');
  const blank = defineComponent({ render: () => null });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: basePath, component: blank },
      { path: `${basePath}/contents/inline/:name`, component: blank },
      { path: `${basePath}/contents/:name`, component: blank },
    ],
  });
  await router.push(options.path ?? `${basePath}/contents/${template.name}`);
  await router.isReady();
  const view = mount(component, {
    attachTo: document.body,
    global: {
      plugins: [router],
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: { $t: (key: string) => key },
    },
  });
  wrappers.push(view);
  await settle();
  return { view, injector, config, contents, definitions, router, toast };
}

describe('text template lists', () => {
  it('renders backend template columns and respects their table visibility', async () => {
    const record = {
      ...template,
      extraProperties: { ServerLabel: 'Backend value', HiddenLabel: 'Hidden value' },
    };
    const { view } = await render(TextTemplatesPage, {
      path: basePath,
      objectExtensions: {
        modules: {
          TextTemplateManagement: {
            entities: {
              TextDefinition: {
                properties: {
                  ServerLabel: {
                    type: 'System.String',
                    typeSimple: 'string',
                    displayName: { name: 'Server label' },
                    ui: { onTable: { isVisible: true } },
                  },
                  HiddenLabel: {
                    type: 'System.String',
                    typeSimple: 'string',
                    ui: { onTable: { isVisible: false } },
                  },
                },
              },
            },
          },
        },
      },
      definitions: { getList: vi.fn(async () => ({ items: [record], totalCount: 1 })) },
    });
    expect(view.text()).toContain('Server label');
    expect(view.text()).toContain('Backend value');
    expect(view.text()).not.toContain('Hidden value');
  });

  it('renders host columns and toolbar actions using the template definition record', async () => {
    const action = vi.fn();
    const { view } = await render(TextTemplatesPage, {
      path: basePath,
      contributions: {
        entityPropContributors: {
          [Keys.TextTemplates]: [
            props =>
              props.addTail(
                EntityProp.create<TemplateDefinitionDto>({
                  name: 'renderEngine',
                  displayName: 'Engine',
                  type: PropType.String,
                }),
              ),
          ],
        },
        toolbarActionContributors: {
          [Keys.TextTemplates]: [
            actions =>
              actions.addTail(
                ToolbarAction.create<readonly TemplateDefinitionDto[]>({
                  text: 'Inspect templates',
                  action,
                }),
              ),
          ],
        },
      },
    });
    expect(view.text()).toContain('Engine');
    expect(view.text()).toContain('Scriban');
    await click(view, 'Inspect templates');
    expect(action).toHaveBeenCalledWith(expect.objectContaining({ record: [template] }));
  });

  it('shows all five official columns and selects the editor from inline localization', async () => {
    const { view, router } = await render(TextTemplatesPage, { path: basePath });
    for (const key of ['Name', 'IsInlineLocalized', 'IsLayout', 'Layout', 'DefaultCultureName'])
      expect(view.text()).toContain(`TextTemplateManagement::${key}`);
    expect(view.text()).toContain(template.displayName);
    await click(view, 'TextTemplateManagement::EditContents');
    expect(router.currentRoute.value.path).toBe(`${basePath}/contents/inline/${template.name}`);
  });

  it('navigates non-inline template names with reserved characters intact', async () => {
    const name = 'Example/a ?#%';
    const { view, router } = await render(TextTemplatesPage, {
      path: basePath,
      definitions: {
        getList: vi.fn(async () => ({
          items: [{ ...template, name, isInlineLocalized: false }],
          totalCount: 1,
        })),
      },
    });
    await click(view, 'TextTemplateManagement::EditContents');
    expect(router.currentRoute.value.params.name).toBe(name);
  });

  it('sends the free text as filterText and retains paging parameters', async () => {
    const { view, definitions } = await render(TextTemplatesPage, { path: basePath });
    await view.get('input[type="search"]').setValue('Welcome');
    await vi.waitFor(() =>
      expect(definitions.getList).toHaveBeenLastCalledWith(
        expect.objectContaining({ filterText: 'Welcome', skipCount: 0, maxResultCount: 10 }),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      ),
    );
  });

  it('hides editing from read-only operators and clears records when access is revoked', async () => {
    const { view, config } = await render(TextTemplatesPage, {
      path: basePath,
      policies: [Policy.TextTemplates],
    });
    expect(view.text()).toContain(template.displayName);
    expect(view.text()).not.toContain('TextTemplateManagement::EditContents');
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: {} } });
    await settle();
    expect(view.text()).not.toContain(template.displayName);
  });

  it('retries a failed list request visibly', async () => {
    const getList = vi
      .fn<TemplateDefinitionService['getList']>()
      .mockRejectedValueOnce(new TypeError('Offline'))
      .mockResolvedValue({ items: [template], totalCount: 1 });
    const { view } = await render(TextTemplatesPage, { path: basePath, definitions: { getList } });
    expect(view.text()).toContain('AbpUi::ErrorLoadingDatatable');
    await click(view, 'AbpUi::Refresh');
    expect(view.text()).toContain(template.displayName);
    expect(view.text()).not.toContain('AbpUi::ErrorLoadingDatatable');
  });
});

describe('text template contents', () => {
  it('does not read contents without both list and editing authorization', async () => {
    for (const policies of [[Policy.TextTemplates], [Policy.EditContents]]) {
      const { view, contents } = await render(undefined, { policies });
      expect(view.find('form').exists()).toBe(false);
      expect(contents.get).not.toHaveBeenCalled();
    }
  });

  it('loads the first target culture and the current reference culture independently', async () => {
    const { view, contents } = await render();
    expect((view.get('#base-culture').element as HTMLSelectElement).value).toBe('fr');
    expect((view.get('#target-culture').element as HTMLSelectElement).value).toBe('en');
    expect((view.get('#reference-content').element as HTMLTextAreaElement).value).toBe(
      'content:fr',
    );
    expect((view.get('#template-content').element as HTMLTextAreaElement).value).toBe('content:en');
    await view.get('#template-content').setValue('Edited target');
    await view.get('form').trigger('submit');
    await settle();
    expect(contents.update).toHaveBeenCalledWith(
      { templateName: template.name, cultureName: 'en', content: 'Edited target' },
      expect.anything(),
    );
  });

  it('edits inline content without a culture and returns to the list after saving', async () => {
    const { view, contents, router } = await render(InlineTemplateContentPage);
    expect(view.find('#base-culture').exists()).toBe(false);
    expect((view.get('#template-content').element as HTMLTextAreaElement).value).toBe(
      'content:inline',
    );
    expect(view.text()).toContain('{{L "Hello"}}');
    expect(view.find('img').exists()).toBe(false);
    expect(view.get('a[target="_blank"]').attributes('href')).toBe(
      'https://abp.io/docs/text-templates',
    );
    await view.get('#template-content').setValue('Inline draft');
    await view.get('form').trigger('submit');
    await settle();
    expect(contents.update).toHaveBeenCalledWith(
      { templateName: template.name, cultureName: undefined, content: 'Inline draft' },
      expect.anything(),
    );
    expect(router.currentRoute.value.path).toBe(basePath);
  });

  it('opens customization per culture without saving the inline draft', async () => {
    const { view, contents, router } = await render(InlineTemplateContentPage);
    await view.get('#template-content').setValue('Unsaved');
    await click(view, 'TextTemplateManagement::CustomizePerCulture');
    expect(router.currentRoute.value.path).toBe(`${basePath}/contents/${template.name}`);
    expect(contents.update).not.toHaveBeenCalled();
  });

  it('rejects empty content before sending a write', async () => {
    const { view, contents } = await render();
    await view.get('#template-content').setValue('');
    await view.get('form').trigger('submit');
    expect(contents.update).not.toHaveBeenCalled();
    expect(view.get('#template-content').attributes('aria-invalid')).toBe('true');
  });

  it('retains the draft and field errors after a refused save and allows correction', async () => {
    const { view, injector, contents } = await render();
    vi.mocked(contents.update).mockImplementationOnce(async () => {
      injector
        .get(ValidationErrorService)
        .dispatch([{ message: 'Template syntax rejected', members: ['Content'] }]);
      throw new TypeError('Refused');
    });
    await view.get('#template-content').setValue('Rejected draft');
    await view.get('form').trigger('submit');
    await settle();
    expect((view.get('#template-content').element as HTMLTextAreaElement).value).toBe(
      'Rejected draft',
    );
    expect(view.text()).toContain('Template syntax rejected');
    await view.get('#template-content').setValue('Corrected draft');
    await view.get('form').trigger('submit');
    await settle();
    expect(contents.update).toHaveBeenCalledTimes(2);
    expect(view.text()).not.toContain('Template syntax rejected');
  });

  it('blocks duplicate submissions while saving', async () => {
    const pending = deferred<TextTemplateContentDto>();
    const { view, contents } = await render(undefined, {
      contents: { update: vi.fn(() => pending.promise) },
    });
    await view.get('form').trigger('submit');
    await view.get('form').trigger('submit');
    expect(contents.update).toHaveBeenCalledOnce();
    expect(view.get('#template-content').attributes('disabled')).toBeDefined();
    pending.resolve({ content: 'Saved' });
    await settle();
    expect(view.get('#template-content').attributes('disabled')).toBeUndefined();
  });

  it('keeps an invariant save active when the available languages change', async () => {
    const pending = deferred<TextTemplateContentDto>();
    const { view, config, contents, router, toast } = await render(InlineTemplateContentPage, {
      contents: { update: vi.fn(() => pending.promise) },
    });
    await view.get('#template-content').setValue('Invariant draft');
    await view.get('form').trigger('submit');
    const signal = vi.mocked(contents.update).mock.calls[0]?.[1]?.signal;
    config.setState({
      ...config.snapshot(),
      localization: {
        ...config.snapshot().localization,
        languages: [{ cultureName: 'de', displayName: 'German' }],
      },
    });
    await settle();
    expect(signal?.aborted).toBe(false);
    pending.resolve({ content: 'Invariant draft' });
    await settle();
    expect(router.currentRoute.value.path).toBe(basePath);
    expect(toast).toHaveBeenCalledOnce();
  });

  it('restores the selected culture and refreshes a matching reference', async () => {
    const { view, contents } = await render();
    await view.get('#base-culture').setValue('en');
    await settle();
    vi.mocked(contents.get).mockResolvedValue({
      name: template.name,
      cultureName: 'en',
      content: 'Restored',
    });
    await click(view, 'TextTemplateManagement::RestoreToDefault');
    expect(contents.restoreToDefault).toHaveBeenCalledWith(
      { templateName: template.name, cultureName: 'en' },
      expect.anything(),
    );
    expect((view.get('#template-content').element as HTMLTextAreaElement).value).toBe('Restored');
    expect((view.get('#reference-content').element as HTMLTextAreaElement).value).toBe('Restored');
  });

  it('retries a failed read after restoration without repeating the restore write', async () => {
    const { view, contents } = await render(InlineTemplateContentPage);
    vi.mocked(contents.get).mockRejectedValueOnce(new TypeError('Offline'));
    await click(view, 'TextTemplateManagement::RestoreToDefault');
    expect(view.text()).toContain('AbpUi::ErrorLoadingDatatable');
    expect(view.get('#template-content').attributes('disabled')).toBeDefined();
    await click(view, 'AbpUi::Refresh');
    expect(contents.restoreToDefault).toHaveBeenCalledOnce();
    expect(view.get('#template-content').attributes('disabled')).toBeUndefined();
  });

  it('disables editing until both content and sandbox metadata are loaded', async () => {
    const metadata = deferred<TemplateDefinitionDto>();
    const { view } = await render(undefined, {
      definitions: { get: vi.fn(() => metadata.promise) },
    });
    expect(view.get('#template-content').attributes('disabled')).toBeDefined();
    metadata.resolve(template);
    await settle();
    expect(view.get('#template-content').attributes('disabled')).toBeUndefined();
  });

  it('shows non-sandboxed content read-only without its additional policy', async () => {
    const { view, contents } = await render(undefined, {
      policies: [Policy.TextTemplates, Policy.EditContents],
      definitions: { get: vi.fn(async () => ({ ...template, isNotSandboxedEngine: true })) },
    });
    expect(view.text()).toContain('TextTemplateManagement::NonSandboxedTemplateWarning');
    expect((view.get('#template-content').element as HTMLTextAreaElement).value).toBe('content:en');
    expect(view.get('#template-content').attributes('disabled')).toBeDefined();
    await view.get('form').trigger('submit');
    await click(view, 'TextTemplateManagement::RestoreToDefault');
    expect(contents.update).not.toHaveBeenCalled();
    expect(contents.restoreToDefault).not.toHaveBeenCalled();
  });

  it('allows a non-sandboxed template with both editing policies', async () => {
    const { view, contents } = await render(undefined, {
      definitions: { get: vi.fn(async () => ({ ...template, isNotSandboxedEngine: true })) },
    });
    await view.get('form').trigger('submit');
    await settle();
    expect(contents.update).toHaveBeenCalledOnce();
  });

  it('ignores late target responses and keeps loading until the newest culture arrives', async () => {
    const older = deferred<TextTemplateContentDto>();
    const newest = deferred<TextTemplateContentDto>();
    const { view, contents } = await render();
    vi.mocked(contents.get).mockImplementation(input =>
      input.cultureName === 'fr' ? older.promise : newest.promise,
    );
    await view.get('#target-culture').setValue('fr');
    await view.get('#target-culture').setValue('de');
    older.resolve({ content: 'Old response' });
    await settle();
    expect(view.get('#template-content').attributes('disabled')).toBeDefined();
    expect((view.get('#template-content').element as HTMLTextAreaElement).value).toBe('');
    newest.resolve({ content: 'German response' });
    await settle();
    expect((view.get('#template-content').element as HTMLTextAreaElement).value).toBe(
      'German response',
    );
    expect(view.get('#template-content').attributes('disabled')).toBeUndefined();
  });

  it('ignores late reference responses without replacing the target draft', async () => {
    const pending = deferred<TextTemplateContentDto>();
    const { view, contents } = await render();
    vi.mocked(contents.get).mockImplementation(input =>
      input.cultureName === 'en'
        ? pending.promise
        : Promise.resolve({ content: 'German reference' }),
    );
    await view.get('#template-content').setValue('Target draft');
    await view.get('#base-culture').setValue('en');
    await view.get('#base-culture').setValue('de');
    await settle();
    pending.resolve({ content: 'Late English reference' });
    await settle();
    expect((view.get('#reference-content').element as HTMLTextAreaElement).value).toBe(
      'German reference',
    );
    expect((view.get('#template-content').element as HTMLTextAreaElement).value).toBe(
      'Target draft',
    );
  });

  it('retries reference failures independently while retaining the editable draft', async () => {
    const { view, contents } = await render();
    await view.get('#template-content').setValue('Target draft');
    vi.mocked(contents.get).mockRejectedValueOnce(new TypeError('Offline'));
    await view.get('#base-culture').setValue('de');
    await settle();
    expect(view.text()).toContain('AbpUi::ErrorLoadingDatatable');
    await click(view, 'AbpUi::Refresh');
    expect((view.get('#reference-content').element as HTMLTextAreaElement).value).toBe(
      'content:de',
    );
    expect((view.get('#template-content').element as HTMLTextAreaElement).value).toBe(
      'Target draft',
    );
  });

  it('moves removed culture choices to an available language without writing an invariant template', async () => {
    const { view, config, contents } = await render();
    config.setState({
      ...config.snapshot(),
      localization: {
        ...config.snapshot().localization,
        languages: [{ cultureName: 'de', displayName: 'German' }],
      },
    });
    await settle();
    expect((view.get('#target-culture').element as HTMLSelectElement).value).toBe('de');
    expect((view.get('#base-culture').element as HTMLSelectElement).value).toBe('de');
    config.setState({
      ...config.snapshot(),
      localization: { ...config.snapshot().localization, languages: [] },
    });
    await settle();
    await view.get('form').trigger('submit');
    expect(contents.update).not.toHaveBeenCalled();
    expect(view.get('#template-content').attributes('disabled')).toBeDefined();
  });

  it('cancels pending writes and removes drafts when the tenant context changes', async () => {
    const pending = deferred<TextTemplateContentDto>();
    const { view, injector, contents, toast } = await render(undefined, {
      contents: { update: vi.fn(() => pending.promise) },
    });
    await view.get('#template-content').setValue('Host draft');
    await view.get('form').trigger('submit');
    const signal = vi.mocked(contents.update).mock.calls[0]?.[1]?.signal;
    injector
      .get(SessionStateService)
      .setTenant({ id: 'tenant-2', name: 'Tenant 2', isAvailable: true });
    await settle();
    expect(signal?.aborted).toBe(true);
    expect(view.find('#template-content').exists()).toBe(false);
    pending.resolve({ content: 'Late host response' });
    await settle();
    expect(toast).not.toHaveBeenCalled();
  });

  it('stops reading and writing when the feature is disabled', async () => {
    const { view, config, contents } = await render();
    config.setState({
      ...config.snapshot(),
      features: { values: { 'TextManagement.Enable': 'FALSE' } },
    });
    await settle();
    expect(view.find('form').exists()).toBe(false);
    expect(contents.update).not.toHaveBeenCalled();
  });

  it('reloads a different route name and cancels reads on unmount', async () => {
    const pending = deferred<TextTemplateContentDto>();
    const { view, contents, definitions, router } = await render();
    vi.mocked(contents.get).mockReturnValue(pending.promise);
    await router.push(`${basePath}/contents/Other.Template`);
    await settle();
    expect(definitions.get).toHaveBeenLastCalledWith('Other.Template', expect.anything());
    const signal = vi.mocked(contents.get).mock.calls.at(-1)?.[1]?.signal;
    view.unmount();
    wrappers.splice(wrappers.indexOf(view), 1);
    expect(signal?.aborted).toBe(true);
    pending.resolve({ content: 'Late result' });
    await settle();
  });

  it('loads each content once when navigation also resets the selected culture', async () => {
    const { view, contents, definitions, router } = await render();
    await view.get('#target-culture').setValue('de');
    await settle();
    vi.mocked(contents.get).mockClear();
    vi.mocked(definitions.get).mockClear();
    await router.push(`${basePath}/contents/Other.Template`);
    await settle();
    expect(definitions.get).toHaveBeenCalledOnce();
    expect(contents.get).toHaveBeenCalledTimes(2);
    expect((view.get('#template-content').element as HTMLTextAreaElement).value).toBe('content:en');
  });
});
