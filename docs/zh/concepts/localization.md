# 本地化

后端通过应用配置和本地化端点提供资源、可用文化和当前文化，前端也可携带应用文字。逻辑使用资源 key，在显示时翻译。

## 翻译完整页面

创建 src/pages/Catalogue.vue：

<<< ../../examples/LocalizationExample.vue

示例需要后端启用 en 与 zh-Hans。应使用 localization.languages 中实际名称，zh、zh-CN、zh-Hans 不是可随意替换的配置项。切换会请求本地化端点，因此这个示例在业务应用中运行，不在离线控件预览中运行。

## 增加前端文字

创建 src/localization.ts：

<<< ../../examples/localization-texts.ts

启动时导入 catalogueTexts，并传给 `provideAbpCore(withOptions({ environment }), catalogueTexts)`。后端使用对应文化后，标题和数量文字随语言更新，不需要重新挂载页面。同资源同 key 的前端文字覆盖后端文字。

后端和多个客户端共用的业务术语宜放在后端资源，仅前端使用的页面标签可随应用发布。按需要覆盖，不要复制全部后端资源。

## 查找与后备文字

BookStore::Catalogue 指定资源，::Catalogue 使用配置的默认资源，由 localization.defaultResourceName 决定。缺失翻译时返回 key，开发环境输出警告，方便看到缺口。

可选包标签可以在接受 LocalizationParam 的契约中使用 `{ key: 'BookStore::Reprint', defaultValue: 'Reprint' }`。不是所有属性都接受它：操作标签和 AbpPage.title 是字符串 key，输入标签和选项标签是已翻译文字。

{0}、{1} 使用位置参数。不要拼接翻译后的句子碎片，也不要把资源文字当原始 HTML 注入。

## 响应式文字与当前文字

| 调用 | 返回和用途 |
| --- | --- |
| $t(key, ...params) | 模板中的响应式文字 |
| localization.t(key, ...params) | 调用时的字符串 |
| localization.tr(key, ...params) | 模板外的 computed 文字 |
| currentLang / languages | 当前文化与可选文化的 computed |
| setLanguage(culture) | 保存选择并加载对应文字 |

表格标题、选项数组应在 computed 中调用 t。模块导入时只翻译一次不会跟随语言变化。setup 中先获取服务，不能在 await 后再 inject。

## 运行时 JSON 与文化钩子

`withOptions({ environment, uiLocalization: { enabled: true, basePath: '/assets/localization' } })` 启用文件，例如 /assets/localization/en.json。格式为 `{ "BookStore": { "Catalogue": "Catalogue" } }`，顶层是资源名，下面是文字。缺失文化文件会被忽略，仍使用后端资源。部署时应返回 JSON，不能被 SPA 回退成 HTML。

其他库需要异步注册文化时使用 withRegisterLocale。原生 Intl 只需要文化名称，不需要导入注册模块。日期、数字格式与周围文字翻译应分别处理。

## 方向与排查

Basic Theme 根据文化配置设置文字方向，右到左文化需要检查标签、下拉定位与键盘移动。显示 key 时检查资源名、文化名、后端资源、前端覆盖和请求响应。停留旧语言时，把翻译移入响应式 computed。参见[日期](/zh/utilities/dates)和[配置](/zh/guide/configuration)。
