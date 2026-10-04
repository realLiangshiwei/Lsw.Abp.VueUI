# 使用包源码

需要深度定制模块时，可以将 npm 包源码释放到自己的项目。

```bash
abpv add-package @lsw-abpvue/identity --with-source-code
abpv add-package all,@lsw-abpvue/theme-basic --with-source-code
abpv add-package --list-source-ready
```

## 输出

源码放入 `packages/`，TypeScript 与构建解析覆盖 npm 包，应用继续使用相同包名导入。`.abpvue/source-code.json` 记录释放版本。源码需要的依赖合入应用后，重新安装依赖。

## 维护责任

本地源码不再自动跟随包更新。doctor 会提示，update 会汇总新版变更但不覆盖本地文件，需要自己审阅并合入。尽量只释放确实需要深度定制的包。

## 恢复 npm 包

移除本地源码目录、tsconfig 中对应路径、构建别名和 `.abpvue/source-code.json` 条目，再安装依赖。npm 依赖本身保留，之前由源码路径覆盖。检查 Vite 与 TypeScript 都恢复到同一个 npm 实例，避免 DI Token 不一致。
