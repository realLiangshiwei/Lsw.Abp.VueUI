# 表单与验证

`useAbpForm` 创建响应式控件，不依赖表单库。声明初始值和验证器，再把控件绑定到主题组件。

<<< ../../examples/FormExample.vue

示例假定后端 POST `/api/app/product` 接收 `{ name: string }`，请按业务服务替换端点与 DTO。

## 控件与表单状态

`form.controls.name.value` 直接表示字段值，`form.value` 表示当前值对象。这些属性不是需要再加一层 `.value` 的 ref。

| 方法或状态 | 含义 |
| --- | --- |
| `validate()` | 验证全部字段、标记已触碰并返回有效性 |
| `valid` / `invalid` | 当前验证结果 |
| `dirty` / `touched` | 控件是否修改、是否访问 |
| `patch(values)` | 加载数据，不标记为已修改 |
| `reset(values?)` | 重置值、交互状态与服务端错误 |
| `setServerErrors(errors)` | 将后端验证错误关联到字段 |
| `unmatchedServerErrors` | 无法匹配字段的错误消息 |

## 后端规则

生成代理的验证器映射包含受支持的 DTO 数据注解。复用对应映射，必要时组合继承 DTO 的规则，后端业务验证仍是最终依据。

`useValidationMessages` 将控件错误转换为本地化消息，`useServerValidation` 将后端验证报告连接到表单。无法匹配字段的消息也应显示在表单或模态框中。

## 对话框

将 `form.dirty` 和保存状态传给 `AbpModal`。取消时调用 footer 插槽的 `close()`，让未保存修改进入确认流程；保存成功后直接关闭。保存失败应保留当前值和对话框。
