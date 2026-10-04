import type { DefaultTheme } from 'vitepress';
import reference from './reference.json';

type Entry = [path: string, english: string, chinese: string];
interface Section {
  english: string;
  chinese: string;
  items: (Entry | Section)[];
}

const sections: Section[] = [
  { english: 'Overview', chinese: '概览', items: [['guide/what-is-this', 'Overview', '项目概览']] },
  {
    english: 'Quick Start',
    chinese: '快速开始',
    items: [
      ['guide/new-solution', 'Create a solution', '创建新解决方案'],
      ['guide/existing-solution', 'Use an existing solution', '接入已有解决方案'],
    ],
  },
  {
    english: 'Development',
    chinese: '开发',
    items: [
      ['development/structure', 'Project structure', '项目结构'],
      ['development/startup', 'Application startup', '应用启动'],
      ['development/common-tasks', 'Services and composables', '服务与组合式函数'],
      ['guide/configuration', 'Configuration', '环境配置'],
      ['development/auto-imports', 'Automatic imports', '自动按需导入'],
      ['guide/backend', 'API proxies', 'API 代理'],
      ['guide/crud-page', 'Application pages', '业务页面'],
      ['development/testing', 'Testing', '测试'],
      ['development/deployment', 'Deployment', '部署'],
    ],
  },
  {
    english: 'Core Functionality',
    chinese: '核心功能',
    items: [
      ['concepts/dependency-injection', 'Dependency injection', '依赖注入'],
      ['concepts/state', 'Application state', '应用状态'],
      ['guide/authentication', 'Authentication', '认证'],
      ['core/current-user', 'Current user', '当前用户'],
      ['concepts/permissions', 'Permissions', '权限'],
      {
        english: 'HTTP requests',
        chinese: 'HTTP 请求',
        items: [
          ['core/http', 'Making requests', '发送请求'],
          ['core/http-errors', 'Error handling', '错误处理'],
          ['utilities/requests', 'Cancellation and lifecycle', '取消与生命周期'],
        ],
      },
      ['concepts/localization', 'Localization', '本地化'],
      ['core/title-strategy', 'Document titles', '浏览器标题'],
      ['core/settings-features', 'Settings and features', '设置与功能'],
      ['core/global-features', 'Global features', '全局功能'],
      ['core/multi-tenancy', 'Multi-tenancy', '多租户'],
      ['concepts/routes-and-menu', 'Routing and navigation', '路由与导航'],
    ],
  },
  {
    english: 'Utilities',
    chinese: '工具',
    items: [
      ['utilities/forms', 'Forms and validation', '表单与验证'],
      ['utilities/modals', 'Modal forms', '模态表单'],
      ['utilities/lists', 'Lists and preferences', '列表与偏好'],
      ['utilities/notifications', 'Notifications and confirmation', '通知与确认'],
      ['utilities/page-alerts', 'Page alerts', '页面提示'],
      ['utilities/dates', 'Dates and timezone', '日期与时区'],
      ['utilities/platform', 'Browser and server boundaries', '浏览器与服务端边界'],
    ],
  },
  {
    english: 'Customization',
    chinese: '定制',
    items: [
      {
        english: 'Theming',
        chinese: '主题',
        items: [
          ['concepts/themes', 'Overview', '概览'],
          ['customization/basic-theme', 'Basic Theme', 'Basic Theme'],
          ['customization/layout', 'Branding and navigation', '品牌与导航'],
          ['customization/create-theme', 'Write a theme', '编写主题'],
        ],
      },
      ['customization/replacement', 'Replace components', '替换组件'],
      {
        english: 'Page extensions',
        chinese: '页面扩展',
        items: [
          ['concepts/extensions', 'Overview', '概览'],
          ['customization/extension-behavior', 'Behavior and defaults', '行为与默认值'],
          ['customization/entity-actions', 'Entity actions', '实体操作'],
          ['customization/table-columns', 'Table columns', '表格列'],
          ['customization/toolbar-actions', 'Toolbar actions', '工具栏操作'],
          ['customization/form-fields', 'Form fields', '表单字段'],
          ['customization/object-extensions', 'Object extensions', '对象扩展'],
        ],
      },
      ['customization/profile-settings', 'Profile and settings tabs', '个人资料与设置页签'],
      ['guide/source-code', 'Work with package source', '使用包源码'],
    ],
  },
  {
    english: 'Components',
    chinese: '组件',
    items: [
      ['components/', 'Overview', '概览'],
      ...reference.components.map(
        item => [`components/${item.slug}`, item.name, item.name] as Entry,
      ),
    ],
  },
];

export function createFrameworkSidebar(locale: 'en' | 'zh'): DefaultTheme.SidebarItem[] {
  const prefix = locale === 'zh' ? '/zh/' : '/';
  function section(item: Section): DefaultTheme.SidebarItem {
    return {
      text: locale === 'zh' ? item.chinese : item.english,
      collapsed: !['Overview', 'Quick Start'].includes(item.english),
      items: item.items.map(child =>
        Array.isArray(child)
          ? { text: child[locale === 'zh' ? 2 : 1], link: prefix + child[0] }
          : section(child),
      ),
    };
  }
  return sections.map(section);
}
