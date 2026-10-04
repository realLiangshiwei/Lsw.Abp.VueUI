import { defineConfig, type DefaultTheme } from 'vitepress';
import reference from './reference.json';

const repository = 'https://github.com/realLiangshiwei/Lsw.Abp.VueUI';
type Locale = 'en' | 'zh';
type Entry = [path: string, english: string, chinese: string];

const framework: [string, string, Entry[]][] = [
  ['Overview', '概览', [['guide/what-is-this', 'Overview', '项目概览']]],
  [
    'Quick Start',
    '快速开始',
    [
      ['guide/new-solution', 'Create a solution', '创建新解决方案'],
      ['guide/existing-solution', 'Use an existing solution', '接入已有解决方案'],
    ],
  ],
  [
    'Development',
    '开发',
    [
      ['development/structure', 'Project structure', '项目结构'],
      ['development/startup', 'Application startup', '应用启动'],
      ['guide/configuration', 'Configuration', '环境配置'],
      ['development/auto-imports', 'Automatic imports', '自动按需导入'],
      ['guide/backend', 'API proxies', 'API 代理'],
      ['guide/crud-page', 'Application pages', '业务页面'],
      ['development/testing', 'Testing', '测试'],
      ['development/deployment', 'Deployment', '部署'],
    ],
  ],
  [
    'Core Functionality',
    '核心功能',
    [
      ['concepts/dependency-injection', 'Dependency injection', '依赖注入'],
      ['concepts/state', 'Application state', '应用状态'],
      ['guide/authentication', 'Authentication', '认证'],
      ['core/current-user', 'Current user', '当前用户'],
      ['concepts/localization', 'Localization', '本地化'],
      ['concepts/permissions', 'Permissions', '权限'],
      ['core/settings-features', 'Settings and features', '设置与功能'],
      ['core/multi-tenancy', 'Multi-tenancy', '多租户'],
      ['concepts/routes-and-menu', 'Routing and navigation', '路由与导航'],
      ['core/http', 'HTTP and errors', 'HTTP 与错误处理'],
    ],
  ],
  [
    'Utilities',
    '工具',
    [
      ['utilities/forms', 'Forms and validation', '表单与验证'],
      ['utilities/lists', 'Lists and preferences', '列表与偏好'],
      ['utilities/requests', 'Request lifecycle', '请求生命周期'],
      ['utilities/notifications', 'Notifications and confirmation', '通知与确认'],
      ['utilities/platform', 'Browser and server boundaries', '浏览器与服务端边界'],
    ],
  ],
  [
    'Customization',
    '定制',
    [
      ['concepts/themes', 'Themes', '主题'],
      ['customization/create-theme', 'Write a theme', '编写主题'],
      ['customization/layout', 'Layouts and navigation', '布局与导航'],
      ['customization/replacement', 'Replace components', '替换组件'],
      ['concepts/extensions', 'Page extensions', '页面扩展'],
      ['customization/object-extensions', 'Object extensions', '对象扩展'],
      ['customization/profile-settings', 'Profile and settings tabs', '个人资料与设置页签'],
      ['guide/source-code', 'Work with package source', '使用包源码'],
    ],
  ],
  [
    'Components',
    '组件',
    [
      ['components/', 'Overview', '概览'],
      ...reference.components.map(
        item => [`components/${item.slug}`, item.name, item.name] as Entry,
      ),
    ],
  ],
];
const modules: Entry[] = [
  ['modules/', 'Overview', '概览'],
  ['modules/account', 'Account', '账户'],
  ['modules/identity', 'Identity', '身份管理'],
  ['modules/permission-management', 'Permission management', '权限管理'],
  ['modules/tenant-management', 'Tenant management', '租户管理'],
  ['modules/feature-management', 'Feature management', '功能管理'],
  ['modules/setting-management', 'Setting management', '设置管理'],
];
const cli: Entry[] = [
  ['cli/', 'Overview', '概览'],
  ...[
    'new',
    'switch-ui',
    'proxy',
    'generate',
    'add-package',
    'eject',
    'create-lib',
    'doctor',
    'update',
  ].map(command => [`cli/${command}`, command, command] as Entry),
  ['cli/configuration', 'Configuration and generated files', '配置与生成文件'],
];
const tutorials: Entry[] = [
  ['tutorials/', 'Overview', '概览'],
  ['tutorials/crud', 'Build a business page', '开发业务页面'],
  ['tutorials/extend-users', 'Extend the users page', '扩展用户页面'],
  ['tutorials/module', 'Create a reusable module', '创建可复用模块'],
];
const api: Entry[] = [
  ['api/', 'How to use the reference', '参考索引说明'],
  ['api/services', 'Service and composable guide', '服务与组合式函数速查'],
  ...[
    'utils',
    'core',
    'oauth',
    'theme-shared',
    'components',
    'theme-basic',
    'account-core',
    'account',
    'identity',
    'permission-management',
    'tenant-management',
    'feature-management',
    'setting-management',
    'cli',
  ].map(name => [`api/${name}`, `@lsw-abpvue/${name}`, `@lsw-abpvue/${name}`] as Entry),
  ['concepts/packages', 'Package dependencies', '包依赖关系'],
];
const maintenance: Entry[] = [
  ['migration/from-angular', 'Migrate from Angular', '从 Angular 迁移'],
  ['migration/api-map', 'Angular API mapping', 'Angular API 对照'],
  ['guide/troubleshooting', 'Troubleshooting', '问题排查'],
  ['release/upgrading', 'Upgrading', '升级'],
  ['release/compatibility', 'Versions and compatibility', '版本与兼容性'],
  ['release/releases', 'Release notes', '发布记录'],
];
function theme(locale: Locale): DefaultTheme.Config {
  const chinese = locale === 'zh';
  const prefix = chinese ? '/zh/' : '/';
  const entries = (items: Entry[]): { text: string; link: string }[] =>
    items.map(([path, en, zh]) => ({ text: chinese ? zh : en, link: prefix + path }));
  const group = (en: string, zh: string, items: Entry[]): DefaultTheme.SidebarItem => ({
    text: chinese ? zh : en,
    collapsed: false,
    items: entries(items),
  });
  const frameworkSidebar = framework.map(([en, zh, items]) => ({
    ...group(en, zh, items),
    collapsed: !['Overview', 'Quick Start'].includes(en),
  }));
  const sidebar: DefaultTheme.Sidebar = {};
  for (const path of [
    'guide',
    'development',
    'concepts',
    'core',
    'utilities',
    'customization',
    'components',
  ])
    sidebar[prefix + path + '/'] = frameworkSidebar;
  sidebar[prefix + 'modules/'] = [group('Modules', '模块', modules)];
  sidebar[prefix + 'cli/'] = [group('CLI', 'CLI', cli)];
  sidebar[prefix + 'tutorials/'] = [group('Tutorials', '教程', tutorials)];
  sidebar[prefix + 'api/'] = [group('API Reference', 'API 参考', api)];
  sidebar[prefix + 'release/'] = [group('Maintenance', '维护', maintenance)];
  sidebar[prefix + 'migration/'] = [group('Maintenance', '维护', maintenance)];
  return {
    nav: [
      { text: chinese ? 'Vue UI' : 'Vue UI', link: prefix + 'guide/what-is-this' },
      { text: chinese ? 'CLI' : 'CLI', link: prefix + 'cli/' },
      { text: chinese ? '模块' : 'Modules', link: prefix + 'modules/' },
      { text: chinese ? '教程' : 'Tutorials', link: prefix + 'tutorials/' },
      { text: chinese ? 'API 参考' : 'API', link: prefix + 'api/' },
      { text: chinese ? '维护' : 'Maintenance', items: entries(maintenance) },
    ],
    sidebar,
    outline: { level: [2, 3], label: chinese ? '本页目录' : 'On this page' },
    docFooter: {
      prev: chinese ? '上一篇' : 'Previous page',
      next: chinese ? '下一篇' : 'Next page',
    },
    lastUpdated: { text: chinese ? '最后更新' : 'Last updated' },
    sidebarMenuLabel: chinese ? '目录' : 'Menu',
    returnToTopLabel: chinese ? '返回顶部' : 'Return to top',
    darkModeSwitchLabel: chinese ? '外观' : 'Appearance',
    editLink: {
      pattern: repository + '/edit/main/docs/:path',
      text: chinese ? '在 GitHub 编辑此页' : 'Edit this page on GitHub',
    },
    footer: {
      message: chinese
        ? '非官方社区项目，采用 MIT 许可证，与 Volosoft 无关。'
        : 'Unofficial community project. MIT licensed. Not affiliated with Volosoft.',
    },
  };
}
export default defineConfig({
  title: 'ABP Vue UI',
  description: 'Vue 3 UI for ABP Framework',
  base: '/Lsw.Abp.VueUI/',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: [/^https?:\/\/localhost/],
  locales: {
    root: { label: 'English', lang: 'en-US', themeConfig: theme('en') },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      description: 'ABP Framework 的 Vue 3 前端',
      themeConfig: theme('zh'),
    },
  },
  themeConfig: {
    socialLinks: [{ icon: 'github', link: repository }],
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: { buttonText: '搜索', buttonAriaLabel: '搜索文档' },
              modal: {
                displayDetails: '显示详细列表',
                resetButtonTitle: '清除搜索',
                backButtonTitle: '关闭搜索',
                noResultsText: '未找到结果',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
              },
            },
          },
        },
      },
    },
  },
});
