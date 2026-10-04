# AbpToastHost

显示 ToasterService 的通知。

[源码](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpToastHost.vue)

## 用法

```vue
<AbpToastHost />
```

## 行为说明

Basic Theme 已在应用外壳中安装通知宿主。自定义外壳时添加宿主，通过 useToaster 发送消息。

## Props

| 名称           | 类型                  | 必填 | 默认值 |
| -------------- | --------------------- | ---- | ------ |
| `containerKey` | `string \| undefined` | 否   | —      |

## Events

没有组件专有事件。原生属性和事件由组件根元素处理。

## Slots

没有命名插槽。

示例为模板片段，需要在页面中提供对应变量和方法。主题控件从 `@lsw-abpvue/theme-shared` 导入，数据与页面组件从 `@lsw-abpvue/components` 导入，也可使用应用模板的自动导入配置。类型和绑定来自公开契约，默认表达式来自当前实现。短横线表示未显式声明默认值；可选 boolean 属性省略时通常为 false。

[包 API](/zh/api/theme-shared)
