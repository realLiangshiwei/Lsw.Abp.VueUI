import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'ABP Vue UI',
  description: 'An unofficial Vue UI for the ABP Framework',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,

  // GitHub Pages serves the site under the repository name.
  base: '/Lsw.Abp.VueUI/',

  head: [['meta', { name: 'theme-color', content: '#42b883' }]],

  // A development URL is not a link anyone can follow from the built site, and the
  // check treats it as a broken one.
  ignoreDeadLinks: [/^https?:\/\/localhost/],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/what-is-this' },
      { text: 'Concepts', link: '/concepts/dependency-injection' },
      { text: 'Modules', link: '/modules/' },
      { text: 'CLI', link: '/cli/' },
      { text: 'From Angular', link: '/migration/from-angular' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting started',
          items: [
            { text: 'What is this', link: '/guide/what-is-this' },
            { text: 'A new solution', link: '/guide/new-solution' },
            { text: 'An existing solution', link: '/guide/existing-solution' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
        {
          text: 'Building an application',
          items: [
            { text: 'Authentication', link: '/guide/authentication' },
            { text: 'Talking to the backend', link: '/guide/backend' },
            { text: 'A CRUD page', link: '/guide/crud-page' },
            { text: 'Owning the source', link: '/guide/source-code' },
          ],
        },
        { text: 'When it does not work', link: '/guide/troubleshooting' },
      ],

      '/concepts/': [
        {
          text: 'Concepts',
          items: [
            { text: 'Dependency injection', link: '/concepts/dependency-injection' },
            { text: 'Application state', link: '/concepts/state' },
            { text: 'Localization', link: '/concepts/localization' },
            { text: 'Permissions', link: '/concepts/permissions' },
            { text: 'Routes and the menu', link: '/concepts/routes-and-menu' },
            { text: 'Themes', link: '/concepts/themes' },
            { text: 'The extension system', link: '/concepts/extensions' },
            { text: 'Package layout', link: '/concepts/packages' },
          ],
        },
      ],

      '/modules/': [
        {
          text: 'Module UIs',
          items: [
            { text: 'Overview', link: '/modules/' },
            { text: 'Account', link: '/modules/account' },
            { text: 'Identity', link: '/modules/identity' },
            { text: 'Permission management', link: '/modules/permission-management' },
            { text: 'Tenant management', link: '/modules/tenant-management' },
            { text: 'Feature management', link: '/modules/feature-management' },
            { text: 'Setting management', link: '/modules/setting-management' },
          ],
        },
      ],

      '/cli/': [
        {
          text: 'The abpv CLI',
          items: [
            { text: 'Overview', link: '/cli/' },
            { text: 'new', link: '/cli/new' },
            { text: 'switch-ui', link: '/cli/switch-ui' },
            { text: 'proxy', link: '/cli/proxy' },
            { text: 'generate', link: '/cli/generate' },
            { text: 'add-package', link: '/cli/add-package' },
            { text: 'create-lib', link: '/cli/create-lib' },
            { text: 'doctor', link: '/cli/doctor' },
            { text: 'update', link: '/cli/update' },
          ],
        },
      ],

      '/migration/': [
        {
          text: 'Coming from the Angular UI',
          items: [
            { text: 'What changes', link: '/migration/from-angular' },
            { text: 'API by API', link: '/migration/api-map' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/realLiangshiwei/Lsw.Abp.VueUI' }],

    editLink: {
      pattern: 'https://github.com/realLiangshiwei/Lsw.Abp.VueUI/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    search: { provider: 'local' },

    footer: {
      message:
        'An unofficial project, released under the MIT License. Not affiliated with Volosoft.',
      copyright: 'Copyright © 2026 Lsw.Abp.VueUI contributors',
    },
  },
});
