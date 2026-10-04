# CRUD 页面

abpv generate 为后端暴露的实体创建普通 Vue 页面，页面直接拥有列、表单控件和 CRUD 方法，可以在一处修改。

```bash
pnpm abpv proxy add --module app
pnpm abpv generate Book
```

从前端目录运行，保持后端启动。Node 不信任本地证书时，两条命令均添加 --insecure。在 pnpm dev 前生成，或生成后重启开发服务。

## 生成内容

```text
src/pages/BooksPage.vue    the template, columns, form and CRUD methods
src/routes.ts            one route and menu entry
```

页面按 template、script setup lang="ts" 顺序排列。列表使用 AbpDataTable、AbpPagination，字段显式使用主题控件，弹窗使用 AbpModal。启用 abpVue.autoImports 时常用 API 自动导入，业务服务与 DTO 保留显式导入。

| 方法 | 行为 |
| --- | --- |
| createBook | 清空选择、重置表单、打开弹窗 |
| editBook | 读取记录、填表、打开弹窗 |
| save | 验证、新增或更新、关闭并刷新 |
| deleteBook | 确认、删除、刷新 |

useListService 管理查询，useAbpForm 管理值与验证。没有页面 token、扩展注册函数或相邻 .extensions.ts。可复用模块 UI 仍使用[扩展系统](../concepts/extensions.md)。

rowActions 是含标签与记录回调的普通 RowAction&lt;RecordDto&gt;。AbpGridActions 将多个操作显示为下拉菜单，单个显示为按钮。页面按权限过滤，请求期间禁用。页脚显示本地化记录范围、总数与分页控件。

## 读取的后端信息

| 后端描述 | 页面内容 |
| --- | --- |
| 返回 PagedResultDto&lt;T&gt; 的 GET | 列表与记录类型 |
| 带 id 的 GET | 编辑前重新读取 |
| POST 请求体 | 表单字段与新增 DTO |
| 带 id 的 PUT | 更新请求 |
| DTO 属性与继承属性 | 列与控件 |
| 数据注解 | 客户端验证器 |
| 授权策略 | 路由与操作权限 |
| 列表 filter 参数 | 搜索框 |

日期使用日期控件，枚举使用本地化选择器，布尔值使用复选框。不支持的嵌套对象、集合会报告，由你实现。编辑时只写字段初始为空，更新保留记录的额外属性与并发戳。

## 定制页面

直接修改生成的 Vue 文件：

- 调整 columns 或通过 #cell-{id} 插槽定制单元格。
- 调整控件及 useAbpForm 定义。
- 在 save 中调整业务请求体。
- 添加自己的按钮与方法。

验证消息显示在控件旁，服务端验证分配给表单，未匹配消息显示在弹窗。失败保持弹窗打开。模态框接收 form.dirty 和忙碌状态，Cancel 使用页脚 close()，可先确认丢弃更改。

后端对象扩展不自动给业务页面添加控件，需显式绑定。模块页面通过贡献者保留自动对象扩展映射。

## 重新生成

除非指定 --force，否则保留已有页面：

```bash
pnpm abpv generate Book --force
```

**--force 替换整个 Vue 页面**，先保存自定义修改。已有模板、业务路由会保留，生成路由不能移动到另一个已有路径。旧 .extensions.ts 留在磁盘，新页面不再导入，自行审阅后移除。

## 选项

模块、目录、本地化、权限、路由名与自动导入选项见 [generate](../cli/generate.md)。
