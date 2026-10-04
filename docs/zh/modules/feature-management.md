# 功能管理

编辑后端提供者的功能，包括从租户管理打开的租户功能。

## 安装与使用

```bash
pnpm add @lsw-abpvue/feature-management@alpha
```

```vue
<AbpFeatureManagement v-model:visible="open" provider-name="T" :provider-key="tenant.id" />
```

从包中导入组件，提供本地显隐值与提供者 key。租户使用 `T`，其他名称需要后端支持。没有独立功能路由。`/config` 的 `provideFeatureManagementConfig()` 将功能管理贡献到设置页，使用此接入时放在设置配置之后。

## 值与权限

布尔功能使用开关，选择功能使用后端定义选项，自由文本使用带支持验证的输入，数值约束使用后端上下界。调用方应拥有选定提供者要求的管理策略，租户行操作使用 `AbpTenantManagement.Tenants.ManageFeatures`。

## 级联与保存

关闭父功能会禁用后代，再打开时恢复原来的子值，只发送发生变化的值。保存失败保留修改，未保存取消遵循模态框契约。

core 的 `FeatureService` 读取当前有效功能，与这里编辑的提供者值不同。自定义保存改变当前有效值后需要刷新会话配置。组件 key 为 `FeatureManagement.FeatureManagementComponent`。
