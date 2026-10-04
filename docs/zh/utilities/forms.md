# 表单与验证

使用 useAbpForm 将值、交互状态和验证放在一起。当前表单是平面控制集合，不提供嵌套表单组或动态数组。

## 提交真实请求

把以下示例放到 src/pages/ProductForm.vue。它假定 POST /api/app/product 接收 `{ name: string }`，请替换为自己的端点与 DTO。应用应已按[启动指南](/zh/development/startup)注册 core 和主题。

<<< ../../examples/FormExample.vue

先提交空值，再提交有效名称。处理函数会标记所有字段 touched、验证、防止重复提交，成功后才重置。请求失败保留输入。

## 值与交互状态

form.controls.name.value 直接是字段值，不需要再取一层 ref。form.value 是当前值对象。不要把原始字段值解构到普通变量后期待它继续响应变化。

| 操作 | 使用场景 |
| --- | --- |
| 写入 control.value | 用户编辑，标记 dirty 并移除旧服务端错误 |
| form.patch(values) | 加载数据，不新增 dirty |
| form.reset(values) | 新建编辑基准，清除 touched/dirty/服务端错误 |
| control.markAsTouched() | 离开字段后显示错误 |
| form.validate() | 标记全部 touched，并返回提交是否有效 |
| form.clearServerErrors() | 清除后端错误，不改变字段值 |

patch 不清除已有 dirty；打开另一条记录时使用 reset。编辑请求需要保留未显示字段、extraProperties 和并发戳。

## 内置规则

| 规则 | 示例 |
| --- | --- |
| 必填 | Validators.required() |
| 长度 | Validators.minLength(4)、Validators.maxLength(128) |
| 数字范围 | Validators.min(1)、Validators.max(20)、Validators.range(1, 20) |
| 格式 | Validators.email()、Validators.url()、Validators.pattern(/\d{4}/) |
| 与其他字段相同 | Validators.compare('password') |

除 required 外，空的可选值会通过其他规则。false 是已定义的布尔值，required 不要求必须勾选。接受条款需要要求 true 的规则。HTML 的范围与长度限制不能替代验证器。后端生成 DTO 可复用生成的规则映射，并显式组合继承规则，它覆盖受支持注解，不覆盖任意业务逻辑。

## 自定义与条件规则

把以下同步验证器放入 src/forms/registration.ts：

<<< ../../examples/custom-validation.ts

验证器返回 null 或 `{ rule, key, params }`，通过 context.valueOf 读取其他控制。示例只对企业账户要求 Company，并检查两次密码相同。字段显示由页面另外控制，隐藏不会自动取消验证器。

验证器不能返回 Promise。远程唯一性检查应使用独立可取消请求并显示状态，最终仍由后端在保存时保证唯一性。之前查询成功不能代替保存时的校验。

## 本地化消息

setup 中调用一次 useValidationMessages，再在 computed 中转换错误，使语言切换后文字同步变化。内置验证器的最后一个参数可覆盖消息，支持资源 key 或带后备文字的 key。[字段示例](/zh/components/form-field)展示了 required/email 自定义消息与 touched 后显示策略。

## 后端验证

请求前在 setup 中调用 useServerValidation(form)，把表单连接到框架验证处理。后端成员按不区分大小写及路径末段匹配，因此 Name、ExtraProperties.Name 可对应 name。unmatchedServerErrors 应显示在提交区域，无法匹配字段的错误也必须可见。

框架 HTTP 处理器会报告失败，本地 catch 可以保留表单而不重复显示通用错误。关闭某个请求的全局错误处理后，页面需要自行显示失败。参见[HTTP 错误](/zh/core/http-errors)。

## 在对话框中编辑

打开前加载或重置，给 AbpModal 绑定 form.dirty 和 saving，取消通过 footer 的受保护 close。失败保留对话框，参见[模态表单](/zh/utilities/modals)。

分别检查必填、条件、跨字段、后端错误、重复提交、失败保存、重置和语言切换。类型检查通过不等于业务端点已经验证。
