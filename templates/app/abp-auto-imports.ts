import { resolve } from 'node:path';
import type { Options } from 'unplugin-auto-import/types';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { normalizePath } from 'vite';
import type { PluginOption } from 'vite';

const components = {
  '@lsw-abpvue/core': ['AbpPermission', 'AbpReplaceable'],
  '@lsw-abpvue/core/router': ['AbpDynamicLayout', 'AbpRouterOutlet'],
  '@lsw-abpvue/components': [
    'AbpDataTable',
    'AbpExtensibleForm',
    'AbpExtensibleTable',
    'AbpGridActions',
    'AbpPage',
    'AbpPageToolbar',
    'AbpRecordModal',
    'AbpTabList',
  ],
  '@lsw-abpvue/theme-shared': [
    'AbpButton',
    'AbpConfirmHost',
    'AbpDatePicker',
    'AbpFormField',
    'AbpInput',
    'AbpModal',
    'AbpPagination',
    'AbpSelect',
    'AbpSpinner',
    'AbpToastHost',
    'AbpToggle',
    'AbpTypeahead',
  ],
};

const imports: Options['imports'] = [
  'vue',
  'vue-router',
  components,
  {
    '@lsw-abpvue/core': [
      ['inject', 'injectAbp'],
      'defineService',
      'defineToken',
      'getCurrentInjector',
      'provideAbp',
      'LayoutType',
      'AuthService',
      'ConfigStateService',
      'CurrentUserService',
      'LocalizationService',
      'PermissionService',
      'RestService',
      'RoutesService',
      'SettingService',
      'mapEnumToOptions',
      'useConfigState',
      'useCurrentUser',
      'useDebounceFn',
      'useEnvironment',
      'useFeature',
      'useHttpWait',
      'useLatest',
      'useListPreferences',
      'useListService',
      'useLocalization',
      'useMultiTenancy',
      'usePermission',
      'useReplaceableComponents',
      'useRest',
      'useRoutes',
      'useSessionState',
      'useSetting',
      'useSubscriptions',
    ],
    '@lsw-abpvue/components': [
      'EntityAction',
      'EntityActionList',
      'EntityProp',
      'EntityPropList',
      'FormProp',
      'FormPropList',
      'PropType',
      'ToolbarAction',
      'ToolbarActionList',
      'getObjectExtensionEntities',
      'getValidatorsFromProperty',
      'groupFormProps',
      'mapEntitiesToContributors',
      'mergeWithDefaultActions',
      'mergeWithDefaultProps',
      'useEntityActions',
      'useExtensibleForm',
      'useExtensions',
      'useRecordEditor',
      'useToolbarActions',
    ],
    '@lsw-abpvue/core/router': ['lazyRoutes', 'useAbpRouter', 'withResolvers'],
    '@lsw-abpvue/theme-shared': [
      'Validators',
      'ConfirmationStatus',
      'useAbpForm',
      'useConfirmation',
      'useErrorPage',
      'useModal',
      'useNavItems',
      'usePageAlert',
      'usePasswordValidators',
      'useServerValidation',
      'useToaster',
      'useUserMenu',
      'useValidationMessages',
    ],
  },
  {
    from: 'vue',
    imports: ['ComputedRef', 'InjectionKey', 'MaybeRef', 'MaybeRefOrGetter', 'Ref'],
    type: true,
  },
  {
    from: '@lsw-abpvue/core',
    imports: [
      'AbpNavItem',
      'AbpNavTab',
      'AbpPolicyName',
      'AbpRoute',
      'AuditedEntityDto',
      'EntityDto',
      'ExtensibleEntityDto',
      'FullAuditedEntityDto',
      'InjectionToken',
      'ListResultDto',
      'ListService',
      'PagedAndSortedResultRequestDto',
      'PagedResultDto',
      'PagedResultRequestDto',
      'Provider',
      'RestConfig',
    ],
    type: true,
  },
  {
    from: '@lsw-abpvue/components',
    imports: [
      'AbpTableColumn',
      'AbpTabItem',
      'EntityActionOptions',
      'EntityPropOptions',
      'FormPropOptions',
      'PropData',
      'RecordEditor',
      'RecordEditorOptions',
      'ToolbarData',
    ],
    type: true,
  },
  {
    from: '@lsw-abpvue/theme-shared',
    imports: ['AbpOption', 'AbpOptionValue', 'AbpSeverity', 'AbpSize', 'ToastOptions'],
    type: true,
  },
];

export function abpAutoImports(root: string): PluginOption[] {
  const src = normalizePath(resolve(root, 'src')).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const include = [new RegExp(`^${src}/.*\\.(?:[jt]sx?|vue)(?:$|\\?)`)];
  const exclude = [/[/\\]node_modules[/\\]/, /[?&](?:type=style|raw|url)(?:&|$)/];

  return [
    AutoImport({
      imports,
      include,
      exclude,
      dts: resolve(root, 'auto-imports.d.ts'),
      dtsMode: 'overwrite',
      vueTemplate: true,
      // Source aliases must keep one DI token identity across application and packages.
      viteOptimizeDeps: false,
    }),
    Components({
      include,
      exclude,
      dirs: [resolve(root, 'src/components')],
      dts: resolve(root, 'components.d.ts'),
      syncMode: 'overwrite',
      types: [
        ...Object.entries(components).map(([from, names]) => ({ from, names })),
        { from: 'vue-router', names: ['RouterLink', 'RouterView'] },
      ],
      resolvers: [
        name => {
          const from = Object.entries(components).find(([, names]) => names.includes(name))?.[0];
          return from ? { name, from } : undefined;
        },
      ],
    }),
  ];
}
