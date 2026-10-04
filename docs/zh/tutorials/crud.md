# 开发业务页面

教程使用可选的 BookStore 后端示例，假定后端已运行、数据库已初始化，当前用户拥有 Books 权限。

## 1. 创建示例

```bash
npx @lsw-abpvue/cli@alpha new Acme.BookStore -d mongodb --sample-crud
```

按照[快速开始](/zh/guide/new-solution)启动后端，示例选项会包含 Books 页面。为之后添加的服务生成页面时，在 `vue/` 中运行：

```bash
pnpm abpv proxy add --module app --insecure
pnpm abpv generate Book --insecure
```

`--insecure` 仅用于本机不受信任的开发证书。代理和页面使用后端实际 DTO 与方法名称。

## 2. 阅读生成页面

打开 `src/pages/BooksPage.vue`。模板在前，脚本声明 `columns`、`rowActions`、列表、表单和请求方法。常用 API 按需自动导入，业务 DTO 和服务显式导入。

页面没有扩展注册，也不使用 `useRecordEditor`。直接修改列和字段，通过表格单元格插槽定制展示，例如将作者 ID 改成查找得到的姓名。

## 3. 理解数据流

`useListService` 生成分页和排序输入，查询函数调用生成服务并传递取消信号。新增重置表单，编辑先读取最新记录再填值。保存先验证，再调用新增或更新；成功后关闭并刷新，验证失败时保留表单。

删除前需要确认。`AbpGridActions` 将多个可见操作显示为下拉菜单，一个显示为按钮，没有操作时为空。

## 4. 按业务调整

在页面中添加业务验证、查找控件、列和操作权限。更新时保留并发标记与扩展属性，分页旁显示本地化记录范围。模态框绑定 dirty 和 busy，取消使用 footer 的 `close()`。

[列表示例](/zh/utilities/lists)和[表单示例](/zh/utilities/forms)分别展示底层 API。`generate --force` 会替换整个页面，重新生成前先保存自定义修改。
