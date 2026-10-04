# 业务页面

`abpv generate` 为后端实体创建普通 Vue 页面，页面自己维护列、表单控件和 CRUD 方法。

```bash
pnpm abpv proxy add --module app
pnpm abpv generate Book
```

后端运行时从前端目录执行，开发证书需要时追加 `--insecure`。页面生成后重启已经运行的 Vite。

## 输出与结构

```text
src/pages/BooksPage.vue
src/routes.ts
```

模板在前，script setup 在后。列表使用 `AbpDataTable`、`AbpPagination`，表单使用主题控件与 `AbpModal`。启用自动导入时省略常用 API 导入，业务服务和 DTO 显式导入。

页面没有 Token、扩展注册函数或邻接 `.extensions.ts` 文件。`useListService` 管理查询，`useAbpForm` 管理控件与验证；可复用模块继续使用扩展系统。

## 行为

| 方法 | 作用 |
| --- | --- |
| createBook | 清空选择，重置并打开表单 |
| editBook | 读取最新记录，填值并打开表单 |
| save | 验证、新增或更新、关闭并刷新 |
| deleteBook | 确认、删除并刷新 |

多个行操作显示为下拉，一个显示为按钮；操作按权限筛选，请求期间禁用。分页旁显示本地化范围与总数。

## 自定义

直接修改 columns、rowActions、表单定义、模板和请求体。通过 `cell-{id}` 插槽定制列。日期、枚举和布尔字段生成对应控件，不支持的嵌套对象与集合需要自行实现。更新保留 extraProperties 与 concurrencyStamp，写入专用字段编辑时为空。

服务端错误进入表单，未匹配错误显示在对话框。失败保留值；模态框接收 dirty 和 busy，取消使用 footer 的 close。业务对象扩展控件由应用显式添加。

## 重新生成

`generate --force` 替换整个 Vue 文件，先保存定制。旧扩展文件保留但不再导入，手工审阅后再删除。参数见 [generate](/zh/cli/generate)，操作教程见[开发业务页面](/zh/tutorials/crud)。
