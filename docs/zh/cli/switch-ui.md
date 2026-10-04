# abpv switch-ui

```bash
abpv switch-ui --dry-run
abpv switch-ui --mode keep
abpv switch-ui --port 5173
```

识别已有 ABP 解决方案并添加 Vue UI。标准结构下 `vue/` 与 `aspnet-core/`、`angular/` 同级，已有平铺后端保持原位置。

## 选项

| 选项 | 含义 |
| --- | --- |
| `--solution <path>` | 项目根或后端目录，默认向上查找 |
| `--mode <replace\|keep>` | 默认 replace，将旧 UI 重命名为备份；keep 保留旧 UI |
| `--dir <path>` | 前端目录，默认 `vue` |
| `--port <n>` | 前端端口，默认 4200 |
| `--modules <list>` | 模块 UI 列表 |
| `--package-manager <name>` | 默认 pnpm |
| `--with-source-code <list>` | 同时释放包源码 |
| `--template <dir>` | 自定义模板 |
| `--skip-install` / `--skip-proxy` | 跳过安装或代理 |
| `--skip-backend-config` | 不修改后端配置，需要自行同步认证地址 |
| `--force` | 允许存在未提交修改 |
| `--dry-run` | 输出差异，不写文件、不安装依赖 |

## 备份与回滚

默认要求干净 Git 工作区。修改前备份文件，JSON 编辑保留注释和格式；旧 UI 被重命名而非删除。已有备份选择下一个可用名称，失败时回滚。预览区分文本差异、重命名与二进制文件，路径相对项目根目录。

完成后重新运行 DbMigrator，让新的客户端回调进入数据库，然后安装和启动前端。见[已有方案接入](/zh/guide/existing-solution)。
