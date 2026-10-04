import { defineConfig, type DefaultTheme } from 'vitepress';
import { createFrameworkSidebar } from './sidebar';
import { searchOptions } from './search';
import { fileURLToPath } from 'node:url';
import { workspaceAliases } from '../../scripts/workspace-aliases';
import { workspaceTypeScript } from './workspace';

const repository = 'https://github.com/realLiangshiwei/Lsw.Abp.VueUI';
type Locale = 'en' | 'zh';
type Entry = [path: string, english: string, chinese: string];

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
  ['tutorials/backend-examples', 'Run the backend examples', '运行后端示例'],
  ['tutorials/module', 'Create a reusable module', '创建可复用模块'],
];
const maintenance: Entry[] = [
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
  const frameworkSidebar = createFrameworkSidebar(locale);
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
  sidebar[prefix + 'release/'] = [group('Maintenance', '维护', maintenance)];
  return {
    nav: [
      { text: chinese ? 'Vue UI' : 'Vue UI', link: prefix + 'guide/what-is-this' },
      { text: chinese ? 'CLI' : 'CLI', link: prefix + 'cli/' },
      { text: chinese ? '模块' : 'Modules', link: prefix + 'modules/' },
      { text: chinese ? '教程' : 'Tutorials', link: prefix + 'tutorials/' },
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
  base: '/',
  cleanUrls: true,
  vite: {
    plugins: [workspaceTypeScript],
    resolve: { alias: workspaceAliases(fileURLToPath(new URL('../../packages', import.meta.url))) },
  },
  srcExclude: ['CHANGELOG.md'],
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
        miniSearch: { options: searchOptions },
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
