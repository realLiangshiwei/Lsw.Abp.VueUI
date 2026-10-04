# Basic Theme

Basic Theme 使用 Bootstrap 实现共享 UI 契约，生成应用默认注册它。业务模块使用 theme-shared 控件，独立于选定的主题实现。

## 安装与注册

手动配置应用时安装主题与样式：

```bash
pnpm add @lsw-abpvue/theme-basic@alpha bootstrap bootstrap-icons
```

在 `src/main.ts` 保留 Core、路由提供者，增加主题：

```ts
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@lsw-abpvue/theme-basic/style.css';
import { provideAbpThemeBasic } from '@lsw-abpvue/theme-basic';

const theme = provideAbpThemeBasic();
```

把 `theme` 放入传给 `createAbpApp` 的 providers。生成应用不需要再次注册。应用样式覆盖放在这些导入之后。

## 主题提供的内容

提供者安装十二个共享控件、应用／账户／空布局及默认反馈与错误展示。应用布局渲染路由出口、侧栏、导航栏、面包屑、页面提示、Toast 和确认宿主。替换整个布局后，这些宿主由你负责。

路由 `meta.layout` 选择布局，不改变认证守卫。账户布局用于本地账户页面；使用授权码认证时，Login 仍可跳转独立授权服务器。

## 品牌与颜色

在运行时配置中设置 `application.name`、`application.logoUrl`。本地图片放在 `public/`，引用部署后的 URL。部署在 `/portal/` 时使用 `/portal/brand.svg`，不能使用绕过应用 base 的根路径。

在应用 CSS 覆盖 `--abp-accent`、`--abp-accent-rgb`、`--abp-accent-hover` 和 `--abp-accent-soft`，暗色覆盖写在 `[data-bs-theme='dark']` 下。这些变量影响主题，第三方控件仍需自己的样式。

## 明暗与系统模式

```ts
import { useThemeMode } from '@lsw-abpvue/theme-basic';

const themeMode = useThemeMode();
const useSystemTheme = () => themeMode.set('system');
const toggleTheme = () => themeMode.toggle();
```

在 setup 中调用。`mode` 是选择的偏好，`resolved` 是实际明暗模式。system 跟随操作系统。主题读取并保存浏览器偏好，本地化文字是另一项配置。

## 选择定制层次

外观修改先从配置和 CSS 开始。Logo／导航组件见[品牌与导航](/zh/customization/layout)，共享输入框或模态框见[组件替换](/zh/customization/replacement)，保留其公开契约。整套实现见[编写主题](/zh/customization/create-theme)。

调整外壳后检查长标签、折叠导航、窄屏、键盘焦点和 RTL。[组件指南](/zh/components/)展示实际交互行为，只有 Bootstrap 类名不会自动实现这些行为。
