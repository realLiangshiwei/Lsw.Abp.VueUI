# 创建新解决方案

CLI 将 ABP 后端写入 `aspnet-core/`，Vue 前端写入 `vue/`。

## 环境准备

使用 Node 20 或以上、包管理器、目标 ABP 版本要求的 .NET SDK，以及官方 ABP CLI：

```bash
dotnet tool install -g Volo.Abp.Studio.Cli
npm install -g @lsw-abpvue/cli
```

本例使用 MongoDB，初始化数据库前需要启动本地服务或 Docker 容器。

## 创建

```bash
abpv new Acme.BookStore -d mongodb
```

```text
Acme.BookStore/
├── aspnet-core/
│   ├── src/
│   └── test/
└── vue/
```

默认前端包含欢迎页与模块 UI，添加 `--sample-crud` 才包含 Books 示例。`--port`、`--modules` 等选项见 [new](/zh/cli/new)。

## 启动后端

```bash
# First run, if no MongoDB server already uses port 27017:
docker run -d --name bookstore-db -p 27017:27017 mongo:8

cd Acme.BookStore/aspnet-core/src/Acme.BookStore.HttpApi.Host
abp install-libs
cd ../Acme.BookStore.DbMigrator
dotnet run
cd ../Acme.BookStore.HttpApi.Host
dotnet run
```

DbMigrator 要在自己的目录内运行，才能读取配置。后续启动使用 `docker start bookstore-db`。分离认证服务器的方案还需要启动对应认证主机。

## 启动前端

新终端从解决方案根目录执行：

```bash
cd vue
pnpm install
pnpm abpv doctor
pnpm dev
```

打开 Vite 显示的地址，点击 Login。默认授权码流程进入认证服务器，登录后回到 Vue。使用种子管理员账户，标准开发密码为 `1q2w3E*`，除非后端已经修改。

CLI 写入客户端地址与 CORS 配置，DbMigrator 将客户端配置初始化到数据库。登录失败见[问题排查](./troubleshooting)。

## 下一步

阅读[环境配置](./configuration)、[项目结构](/zh/development/structure)和[业务页面](./crud-page)。仅创建前端使用 `new --no-backend --backend <url>`，文件直接写入输出目录。
