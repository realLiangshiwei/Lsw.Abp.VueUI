# 使用包源码

模块 UI 默认来自 npm，必要时可以把源码释放到应用仓库。

```bash
abpv add-package @lsw-abpvue/identity --with-source-code
abpv add-package all,@lsw-abpvue/theme-basic --with-source-code
abpv add-package --list-source-ready
```

源码进入 packages/，tsconfig.json 的路径覆盖 npm 包；应用导入名称保持不变。

```
your-app/
├── packages/identity/          the source, yours now
├── src/                        untouched: still imports @lsw-abpvue/identity
├── tsconfig.json               paths: { "@lsw-abpvue/identity": ["./packages/identity/src"] }
└── .abpvue/source-code.json    what was released, and at which version
```

## 释放后重新安装

释放包的依赖会加入应用。包自身依赖原本位于 node_modules 的包目录，源码移出后不再处于该位置。pnpm 下 packages/theme-basic 看不到原包安装的 reka-ui，因此需重新安装应用依赖。npm、yarn 的平铺布局可能可用，但也应保持严格布局兼容。

## 维护成本

释放的包不再自动跟随发布。abpv update 会列出包与释放版本，方便手动合入修复；abpv doctor 每次也会报告。

源码可读可改，同时升级由你维护。只释放实际需要定制的模块。

## 恢复 npm 包

删除 packages/ 下对应目录，移除 tsconfig.json paths、构建别名和 .abpvue/source-code.json 对应记录，再安装。npm 依赖一直存在，只是被路径覆盖，无需重新添加。
