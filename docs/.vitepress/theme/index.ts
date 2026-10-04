import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@lsw-abpvue/theme-basic/style.css';
import DefaultTheme from 'vitepress/theme';
import DocsDemo from './DocsDemo.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: Parameters<NonNullable<typeof DefaultTheme.enhanceApp>>[0]) {
    app.component('DocsDemo', DocsDemo);
  },
};
