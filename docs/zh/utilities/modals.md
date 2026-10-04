# 模态表单与未保存修改

模态框适合短小、集中的表单。页面拥有显隐、字段值和保存请求；模态框保护用户关闭路径并管理焦点。

## 完整表单示例

示例假定 POST `/api/app/product` 接收 `{ name: string }`。通过应用正常布局注册主题与确认宿主。

<<< ../../examples/ModalFormExample.vue

保存为 `src/components/ModalFormExample.vue`，在应用页面渲染。为标题提供示例使用的 BookStore 本地化 key。

## 关闭路径

| 路径 | 行为 |
| --- | --- |
| footer 的 `close()`、右上角关闭、Esc、遮罩 | 执行关闭保护 |
| 未保存输入或 `dirty: true` | 询问是否丢弃修改 |
| `busy: true` | 阻止用户关闭请求 |
| 保存成功，页面设置 `visible = false` | 直接关闭 |
| 保存失败 | 页面保留模态框与输入 |
| 组件卸载 | 清理未结束的确认与监听 |

取消按钮绑定作用域插槽的 `close`。取消时直接设置 `visible = false` 会绕过丢弃确认；直接赋值适用于操作完成或有意的程序关闭。

模态正文中的原生 input/change 会标记修改。`dirty` 补充自定义控件和没有原生事件的程序修改，两者共同参与判断；已经发生原生输入后，将 dirty 改为 false 不会撤销本次打开期间记录的修改。

`busy` 保护关闭路径，自定义页脚控件仍应绑定禁用／加载状态。它不会自动禁用任意插槽内容。

## 为单个模态框关闭确认

~~~vue
<AbpModal
  v-model:visible="visible"
  :suppress-unsaved-changes-warning="true"
  aria-label="Preview"
>
  <p>{{ preview }}</p>
</AbpModal>
~~~

`visible` 与 `preview` 是页面变量。该属性仅关闭此实例的未保存警告，不会关闭 busy 保护。

## 尺寸与生命周期

使用 `size` 选择 `sm`、`md`、`lg` 或 `xl`，默认 `md`；`centered` 控制垂直居中。标题放入 header 插槽，完整正文放入默认插槽，操作放入 footer。

`init` 在每次打开时、对话框进入文档前触发。`appear` 与 `disappear` 通知可见状态变化，不表示动画结束。需要全局统一的尺寸或关闭策略时，可以写一个应用组件封装常用属性。

## 导航与焦点

编辑中的模态框可以参与浏览器页面卸载确认，关闭保护不等于全应用的未保存表单路由守卫。需要阻止 SPA 导航的页面应添加自己的离开路由检查。

有 header 时通过它命名对话框，没有 header 时提供 `ariaLabel`。关闭后焦点返回触发元素。检查 Esc、遮罩、取消、保存失败和多次打开关闭的行为。

相关契约见[模态框属性与插槽](/zh/components/modal)、[表单](/zh/utilities/forms)与[确认](/zh/utilities/notifications)。
