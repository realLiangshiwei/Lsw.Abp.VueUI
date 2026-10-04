# 权限管理

管理后端提供的权限。身份模块为用户和角色打开对话框，其他页面也可为受支持的提供者使用它。

## 安装与使用

```bash
pnpm add @lsw-abpvue/permission-management@alpha
```

```vue
<AbpPermissionManagement
  v-model:visible="open"
  provider-name="R"
  :provider-key="role.name"
  :entity-display-name="role.name"
/>
```

若解析器未覆盖，需要从包中导入 `AbpPermissionManagement`。提供本地布尔值 `open` 与角色记录。对话框没有独立页面路由或启动菜单提供者。

## 提供者与授权

ABP 提供者包括角色 `R`、用户 `U`、客户端 `C`。Key 使用后端对应标识：R 为角色名，U 为用户 ID。需要安装相应后端授权提供者，调用者拥有该对象的权限管理策略。

## 编辑行为

展示分组、权限层级和其他来源的授权。用户通过角色继承的权限显示为已授权且禁用。授予子权限同时授予父权限，撤销父权限同时撤销后代。搜索只缩小展示范围，不丢弃当前编辑状态。

保存只发送相对初始状态的变化。失败保留修改，取消走模态框的未保存确认。授权工具函数和服务 DTO 见 [API 参考](/zh/api/permission-management)。可替换 key 为 `PermissionManagement.PermissionManagementComponent`。
