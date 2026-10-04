# abpv eject

`eject` 是 `add-package --with-source-code` 的别名：

```bash
abpv eject @lsw-abpvue/identity --dry-run
abpv eject @lsw-abpvue/identity
```

它将支持源码释放的包复制到应用的 `packages/`，配置源码解析，并在 `.abpvue/source-code.json` 记录版本。完成后重新安装依赖。

本地源码由应用自行维护，`update` 不会覆盖它。包列表和选项见 [add-package](./add-package)，恢复使用 npm 包见[使用包源码](/zh/guide/source-code)。
