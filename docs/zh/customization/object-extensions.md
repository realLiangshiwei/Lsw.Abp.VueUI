# 对象扩展

ABP 在应用配置中发送模块对象扩展元数据，受支持的可复用模块页面将它映射为表格列与表单控件。属性定义、授权、验证和持久化由后端负责。

## 添加后端属性

在解决方案 Domain.Shared 的 `<Project>ModuleExtensionConfigurator` 中，将以下 API 配置加入已有的 `ConfigureExtraProperties()` 方法：

~~~csharp
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Identity;
using Volo.Abp.ObjectExtending;
using Volo.Abp.ObjectExtending.Modularity;

ObjectExtensionManager.Instance.Modules().ConfigureIdentity(module =>
    module.ConfigureUser(entity =>
        entity.AddOrUpdateProperty<string>("SocialSecurityNumber", property =>
        {
            property.Attributes.Add(new RequiredAttribute());
            property.Attributes.Add(new StringLengthAttribute(64) { MinimumLength = 4 });
            property.UI.OnTable.IsVisible = true;
            property.UI.OnCreateForm.IsVisible = true;
            property.UI.OnEditForm.IsVisible = true;
        })));
~~~

确认启动时调用已有的配置器。此处配置 Identity.User 元数据，不需要为 Vue 安装额外后端包。

数据库映射遵循当前 ABP 版本和数据库提供者。EF Core 独立列需要相应的对象扩展映射和数据库迁移；也可以使用提供者已有的 extra-properties 字段存储。重新构建、启动后端，并在该解决方案中验证持久化。

给已有用户新增必填属性，需要处理历史记录中的空值。示例应在开发方案使用，或配合适当的数据迁移。

## 检查运行时元数据

在与页面相同的登录用户、主机／租户下，检查：

~~~text
/api/abp/application-configuration
objectExtensions.modules.Identity.entities.User.properties.SocialSecurityNumber
~~~

核对类型、验证属性、`api.onGet/onCreate/onUpdate` 和 `ui.onTable/onCreateForm/onEditForm`。UI 显隐与 API 可用性分别控制不同位置。为属性显示名称添加后端本地化文本。

刷新配置会更新元数据；重新进入模块路由会组装扩展列表。启动时使用旧元数据的应用可以重新加载。

## 前端自动映射

映射支持已知类型、枚举选项、验证注解、查找地址、默认值、UI 显隐、顺序、只读配置和权限／功能条件。未知类型可能回退为文本，不会自动生成任意自定义控件。

用户映射 `Identity.User`，角色映射 `Identity.Role`，租户映射 `TenantManagement.Tenant`。这些实体名称与 `Identity.UsersComponent` 等可替换组件 key 不同。

展示受支持的后端属性不需要再添加贡献者。需要覆盖位置、控件或验证器时，再使用[表单贡献者](/zh/customization/form-fields)。

## 保存并保留已有值

新增／更新正文中的扩展值位于：

~~~json
{
  "extraProperties": {
    "SocialSecurityNumber": "12345678"
  }
}
~~~

这里省略了端点的其他必填字段。编辑时，`useExtensibleForm(record).toRequestBody()` 以已有扩展值为基础，覆盖修改过的控件；没有显示的属性仍会保留。

自动显示字段不能证明值已持久化。创建、保存、重新打开记录，检查新的 GET 响应；同时发送无效值，确认后端拒绝请求。

## 普通业务页面

生成应用页面显式拥有列与控件，需要自行添加字段，将编辑值合并到已有 `extraProperties`。它们不会自动消费模块贡献者元数据。

## 排查缺失字段

| 表现 | 检查位置 |
| --- | --- |
| 配置中没有属性 | 后端配置器、实体名与 API 可用性 |
| 有元数据但不显示 | UI 开关、当前策略／功能条件与支持的类型 |
| 字段出现两次 | 宿主贡献者是否添加了同名字段却未移除映射字段 |
| 保存成功但值消失 | 端点映射与实际数据库持久化 |
| 查找字段只显示 id | 查找端点、显示／值属性名与权限 |
| 换用户／租户后不同 | 当前会话的有效应用配置 |

`abpv doctor` 比较元数据与受支持的映射，不能验证数据库持久化语义。另见[扩展](/zh/concepts/extensions)、[表单字段](/zh/customization/form-fields)。

## 完整开发顺序

1. 后端配置属性、验证、UI/API 标志，确认配置器在模块元数据组装前被调用。
2. 在后端资源中为每个支持文化增加显示名称。
3. 选择提供者的持久化方式：EF Core 独立列需要映射与迁移，额外属性字段需要确认端点与实体映射保留值。
4. 重启后端，在目标宿主或租户会话检查应用配置。
5. 打开 Users，受支持的自动属性不需要前端贡献器，只有有意覆盖时才添加。
6. 创建、保存、GET 详情、编辑、再次保存与 GET，同时检查请求和响应 extraProperties。

给已有记录增加必填属性时，先补种子值或迁移，前端默认值不能修复已有数据库行。查找属性还需在同一会话确认 URL、id/显示成员名与权限。

## 安全覆盖一个映射

[表单字段](/zh/customization/form-fields)中的 SocialSecurityNumber 先删除同名自动属性，再增加自定义项，避免一个请求成员对应两个控件，并明确保留必填和长度规则。表格显示也要变更时再添加对应列贡献器。

普通业务页面需要将编辑值合并进已载入记录的 extras。只发送一个可见额外属性，在后端替换字典时可能删除隐藏值。可复用 editor 的 toRequestBody 会保留它们，手写页面要自己构造请求体。

## 前端不能推断的部分

UI 元数据不能证明数据库迁移已运行、应用服务正确复制了 extras，或授权规则已经执行。Doctor 检查受支持映射覆盖，不验证数据往返持久化。字段显示出来后仍需要继续检查保存。
