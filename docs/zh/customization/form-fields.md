# 动态表单字段扩展

新增与编辑表单分别拥有贡献者。本例把必填的 `SocialSecurityNumber` 扩展属性放在姓氏字段后。

## 先配置后端

Identity 用户扩展需要声明字符串属性 SocialSecurityNumber，允许在新增／编辑 UI 显示，并在新增／更新请求中接收它。前端贡献者本身不能添加持久化存储，使用示例之前先完成[对象扩展](/zh/customization/object-extensions)。

## 定义字段

<<< ../../examples/user-form-fields.ts

## 注册到模块路由

将示例保存为 `src/identity-options.ts`，在 `src/routes.ts` 使用导出的选项：

~~~ts
import { lazyRoutes } from '@lsw-abpvue/core/router';
import { userFormFields } from './identity-options';

const identityRoute = lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(userFormFields)),
);
~~~

将 `identityRoute` 放入应用路由数组，并保留启动时的 `provideIdentityConfig()`。替换已有 identity 路由，不要为同一前缀注册两份路由。模块配置改变后重启开发服务，再打开 `/identity/users`。


贡献者先移除自动映射的同名属性，再插入替换字段，避免出现两个控件。删除映射字段的验证器后，应重新提供所需规则。

## 字段选项

| 选项 | 默认值／行为 |
| --- | --- |
| `type` | 必填，决定主题控件 |
| `isExtra` | 默认 false；true 时写入 `extraProperties` |
| `defaultValue` | 记录没有已有值时使用 |
| `validators` | 默认无验证器，返回 `AbpValidator[]` |
| `disabled`／`readonly` | 条件回调，默认 false |
| `visible`／`permission` | 渲染条件 |
| `options` | 枚举、选择、查找控件选项，支持值、Promise、Ref、getter |
| `group` | 同名分组中的字段一起显示 |
| `component` | 替换类型对应的控件 |

即使控件只编辑字符串，也使用 `FormProp<IdentityUserDto>`，泛型描述回调能访问的整条记录。编辑回调可以读取已有记录，新增回调不能假定记录已有 id。

选择控件可以提供 `options: () => [{ value: 'internal', label: 'Internal' }, { value: 'external', label: 'External' }]`。返回选项时自行本地化 label 标签。

## 自定义控件契约

自定义字段组件接收 `modelValue`、`prop`、`record`、`disabled` 和 `readonly`，通过 `update:modelValue` 更新控件。record 不是可写表单模型。模型类型应匹配，遵守禁用和只读状态，并保留键盘及可访问标签行为。

仅在一个页面替换字段展示时，`AbpExtensibleForm` 的 `field-{name}` 插槽接收 `{ prop, control }`。绑定 `control.value`，不要直接修改 `record.extraProperties`。

## 请求正文与验证

`useExtensibleForm(record).toRequestBody()` 把扩展控件写入 `extraProperties`，保留记录中没有显示的扩展属性。完整替换页面自行提交时，应使用该请求正文。服务端验证仍然是最终依据。

前端禁用／只读不能阻止伪造请求，禁止修改某属性的规则也需要在后端执行。

## 检查效果

用有效值创建用户，重新打开编辑，确认值保留。提交空值或过短值，检查字段消息。观察请求中的 `extraProperties.SocialSecurityNumber`，随后 GET 应返回保存值。

另见[扩展行为](/zh/customization/extension-behavior)、[表单验证](/zh/utilities/forms)与[对象扩展](/zh/customization/object-extensions)。

## 条件行为与编辑值

谓词的 data.record 是传入记录，不是隐式实时表单对象。创建不能假定已有 id，检查 record.isActive 也不会自动观察正在编辑的 isActive 控制。依赖编辑值的条件应通过应用字段或插槽读取实际 control，并用 context.valueOf 编写条件验证。参见[自定义规则](/zh/utilities/forms)。

visible、disabled、readonly 是 UI 决策。隐藏控制仍在已构建表单中，验证器仍可能阻止保存。只在某条件下有意义的必填值，需要把条件写入验证，不能因为不显示就删除已有额外属性。

## 自定义字段组件

组件接收 modelValue、prop、record、disabled、readonly，发出 update:modelValue。字符串控件可包装 AbpInput，转发状态及字段 id、描述属性。字段插槽直接提供 control，更新 control.value，不修改后端 record。应用专属覆盖适合插槽，可复用控件适合贡献组件。

## 创建与编辑

即使使用同一回调，也分别注册创建与编辑。创建使用初始值，编辑优先使用返回的记录与 extraProperties。并发戳不应作为普通可见文本字段，由更新流程保留。列表未返回完整编辑字段时，应先读取详情。

修改贡献器后重新进入路由，使用解析后的列表。在打开表单前增删排序，注册表变化不能安全迁移已经打开的表单状态。


## 完整自定义控件

后端需要定义可选字符串额外属性 EmployeeCode，并允许创建与更新。复制两个文件，在已有 createIdentityRoutes 中传入 customUserControl，增加 BookStore::EmployeeCode 资源。组件将输入转为大写，并把继承的字段属性转发给 AbpInput。

<<< ../../examples/CustomCodeInput.vue

<<< ../../examples/custom-user-control.ts
