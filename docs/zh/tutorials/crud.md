# 开发并定制业务页面

本教程创建可选的 BookStore 示例，再修改价格显示和验证。页面使用普通 Vue 代码，不注册模块贡献者。

## 1. 创建解决方案

~~~bash
npx @lsw-abpvue/cli@alpha new Acme.BookStore -d mongodb --sample-crud
~~~

按照[快速开始](/zh/guide/new-solution)初始化并启动后端，在 `vue/` 启动前端，使用拥有 Books 示例权限的账户登录。可选示例包含 Authors 与 Books 端点；默认解决方案没有这些实体。

打开 `/books`，先确认记录正常加载，再修改页面。找不到页面时，检查创建命令是否包含 `--sample-crud`。

## 2. 找到页面与职责

打开 `vue/src/pages/BooksPage.vue`，模板在前，setup 脚本在后。

| 位置 | 职责 |
| --- | --- |
| `columns` | 列标题、排序字段与展示 |
| `rowActions` | 按策略过滤的显式记录回调 |
| `list`／查询函数 | 分页、排序、加载与请求 |
| `form`／`buildForm` | 验证器与新增、编辑初始值 |
| `createBook`／`editBook` | 加载作者选项并打开模态框 |
| `save` | 验证、POST／PUT、成功关闭并刷新 |
| `deleteBook` | 确认、DELETE 并刷新 |

为新增的后端实体生成代理和页面时，在 `vue/` 执行：

~~~bash
pnpm abpv proxy add --module app --insecure
pnpm abpv generate Book --insecure
~~~

`--insecure` 仅用于不受信任的本机开发证书。generate 会保留已有页面，因此这条命令不会覆盖示例页面。生成服务与 DTO 来自实际后端，名称和字段可能与可选示例不同。

## 3. 格式化价格

创建 `src/components/PriceCell.vue`：

<<< ../../examples/PriceCell.vue

在 BooksPage 脚本中显式导入：

~~~ts
import PriceCell from '../components/PriceCell.vue';
~~~

在已有 `AbpDataTable` 内增加单元格插槽：

~~~vue
<template #cell-price="{ row }">
  <PriceCell :price="row.price" currency="USD" />
</template>
~~~

列 id 保持 `price`，才能匹配插槽。币种使用业务实际单位，示例只格式化数值，不转换汇率。切换语言后数字呈现随之更新。

## 4. 增加非负价格验证

保留字段类型与初始值，扩展验证器数组：

~~~ts
price: {
  value: null as number | null,
  validators: [Validators.required(), Validators.min(0)],
},
~~~

使用显式导入的页面从 `@lsw-abpvue/theme-shared` 导入 Validators；生成应用的自动导入可能已经提供。字段仍应通过页面的 `errorsOf('price')` 显示错误。

这一步添加前端反馈，后端价格验证仍然需要保留。需要持久化的新字段也必须进入请求 DTO 和后端契约。

## 5. 保留保存流程

模态框 dirty 绑定表单，busy 绑定保存状态。取消使用 footer 的 `close()`；保存成功直接关闭，失败保留字段值。

编辑先读取最新记录，再填写控件。DTO 包含并发标记或扩展属性时，更新正文需要保留它们。成功更新后刷新查询，不要在 finally 中无条件关闭模态框。

自定义列表查询应将 AbortSignal 传给 RestService／生成服务，取消过期请求。[列表](/zh/utilities/lists)提供完整类型化示例。

## 6. 检查整个过程

1. 选择作者、类型、日期和有效价格，创建书籍。
2. 输入空价格和负价格，确认字段提示且没有成功保存。
3. 编辑记录，确认价格格式化显示。
4. 修改字段后取消，分别检查保留修改和确认丢弃。
5. 检查排序、每页条数与本地化记录范围。
6. 通过确认删除测试书籍。
7. 使用缺少新增／编辑／删除策略的用户重复检查。

集成前执行 `pnpm typecheck` 与 `pnpm build`。`generate --force` 会替换整个页面，使用之前先保留自定义修改。

继续阅读[模态表单](/zh/utilities/modals)、[表单](/zh/utilities/forms)、[列表](/zh/utilities/lists)或[可复用模块扩展](/zh/concepts/extensions)。
