# AbpConfirmHost

显示 ConfirmationService 的确认请求。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpConfirmHost.vue)

## 用法

```vue
<AbpConfirmHost />
```

## 行为说明

Basic Theme 已提供宿主。useConfirmation().warn() 返回 ConfirmationStatus，执行删除等操作前应与 ConfirmationStatus.confirm 比较。

## Props

没有组件专有参数。

## Events

没有组件专有事件。原生属性和事件由组件根元素处理。

## Slots

没有命名插槽。

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/theme-shared)
