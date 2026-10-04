# abpv add-package

```bash
abpv add-package @lsw-abpvue/identity
abpv add-package @lsw-abpvue/identity --with-source-code
abpv add-package all,@lsw-abpvue/theme-basic --with-source-code
abpv add-package --list-source-ready
```

## 选项

| 选项 | 含义 |
| --- | --- |
| `<package>` | 包名或逗号分隔列表 |
| `--with-source-code` | 释放源码到本地 |
| `--list-source-ready` | 列出支持源码释放的包 |
| `--dry-run` | 只预览 |

`all` 表示全部模块 UI，主题需要单独列出，因此 `all,@lsw-abpvue/theme-basic` 包含模块和主题。

## 源码归属

源码写入 `packages/`，TypeScript 与构建解析指向本地入口，应用导入名称不变。所需依赖合入应用后应重新安装。`.abpvue/source-code.json` 记录释放版本，update 和 doctor 都会提示它不再自动跟随 npm 更新。

该命令不代表已经注册模块菜单与路由，还需要按[模块文档](/zh/modules/)完成接入。[eject](./eject) 是源码释放的别名。
