# AbpModal

带关闭保护的模态框。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpModal.vue)

## 用法

```vue
<AbpModal v-model:visible="visible" :busy="saving" :dirty="form.dirty">
  <template #header><h2>Edit record</h2></template>
  <form @submit.prevent="save">...</form>
  <template #footer="{ close }">
    <AbpButton variant="secondary" @click="close">Cancel</AbpButton>
    <AbpButton :loading="saving" @click="save">Save</AbpButton>
  </template>
</AbpModal>
```

## 行为说明

取消、关闭按钮、Esc 和遮罩会请求受保护的关闭。原生输入变更或 dirty 会触发丢弃确认，busy 会阻止用户关闭。保存成功后直接设置 visible=false；取消使用 footer.close()。init/appear/disappear 描述可见状态生命周期，不表示动画结束。关闭后焦点返回触发元素。

## Props

| 名称                            | 类型                                        | 必填 | 默认值 |
| ------------------------------- | ------------------------------------------- | ---- | ------ |
| `visible`                       | `boolean`                                   | 是   | —      |
| `busy`                          | `boolean \| undefined`                      | 否   | —      |
| `size`                          | `'sm' \| 'md' \| 'lg' \| 'xl' \| undefined` | 否   | `'md'` |
| `centered`                      | `boolean \| undefined`                      | 否   | —      |
| `dirty`                         | `boolean \| undefined`                      | 否   | —      |
| `suppressUnsavedChangesWarning` | `boolean \| undefined`                      | 否   | —      |
| `ariaLabel`                     | `string \| undefined`                       | 否   | —      |

## Events

| 名称             | 参数               |
| ---------------- | ------------------ |
| `update:visible` | `[value: boolean]` |
| `init`           | `[]`               |
| `appear`         | `[]`               |
| `disappear`      | `[]`               |

## Slots

| 名称      | 上下文                                                 |
| --------- | ------------------------------------------------------ |
| `header`  | `() => unknown`                                        |
| `default` | `() => unknown`                                        |
| `footer`  | `(context: { close: () => Promise<void> }) => unknown` |

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/theme-shared)
