# TypeRoom

TypeRoom 是一个可维护的 Vue 3 + TypeScript 在线学习与运行平台，支持在浏览器中运行 TypeScript/JavaScript、预览 HTML/CSS/JavaScript、练习 TypeScript 面试题、使用 Claude 或第三方兼容接口审查答案，以及阅读结构化的中文 TypeScript 文档。

## 功能

- 实时运行 TypeScript 和 JavaScript，并展示控制台输出
- 一次性 Web Worker 沙箱、2 秒终止机制和网络能力阻断
- 隔离的 HTML/CSS/JavaScript 实时预览、响应式视口、控制台捕获和循环保护
- 50 道 TypeScript 面试题，包含选择题、简答题和可执行编程题
- 在浏览器本地保存练习进度和答案
- Claude 答案审查代理，支持参数校验、请求大小限制和限流
- 支持用户配置第三方 Key、API 上游地址和自定义模型 ID
- 16 章中文 TypeScript 手册，包含分类导航、示例和官方资料来源
- 适配桌面端和移动端的响应式界面

## 技术栈

- 前端：Vue 3、TypeScript、Vite、Vue Router、CodeMirror 6
- API：Node.js 20、Express 5、Anthropic SDK、Zod
- 质量工具：vue-tsc、ESLint、Vitest、Prettier
- 部署：Docker、Docker Compose、GitHub Actions、阿里云 ACR、Nginx

## 本地开发

要求 Node.js 20.19 或更高版本。

```bash
npm install
cp .env.example .env
npm run dev
```

访问 `http://127.0.0.1:5173`。Vite 会把 `/api` 请求代理到 `8787` 端口的 API 服务。

没有 Claude Key 时应用仍可运行。需要启用 AI 审查时，可以在 `.env` 中设置 `ANTHROPIC_API_KEY`，也可以保留 `ALLOW_CLIENT_AI_KEY=true`，让用户在 AI 设置页面填写仅当前浏览器会话使用的 Key。

## 生产构建

```bash
npm run check
npm run build
NODE_ENV=production npm start
```

`npm run build` 会把前端产物输出到 `dist/`，把 Node.js API 输出到 `dist-server/`。生产 API 同时提供前端静态文件和 `/api` 接口。

在容器内运行时需要监听 `HOST=0.0.0.0`，这样 Docker 端口映射才能访问容器进程。`0.0.0.0` 是监听所有网络接口的通配地址，不是浏览器应访问的服务器地址。

项目默认使用 `HTTPS_ONLY=false`，适配尚未配置证书的 HTTP 环境，不会把 JS/CSS 请求自动升级为 HTTPS。完成 Nginx HTTPS 配置后再设置 `HTTPS_ONLY=true`。

本地 Docker 构建：

```bash
docker build -t ts-live-lab-local .
docker run --rm -p 127.0.0.1:8787:8787 --env-file .env ts-live-lab-local
```

## 阿里云 ACR 部署

完整的新手教程见 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)，其中包含 ACR 实例创建、GitHub Secrets、GitHub Actions 原理、Debian 12 部署、Nginx、HTTPS、更新、回滚和常见故障排查。

向 `main` 分支或 `v*` Git Tag 推送时，`.github/workflows/docker-image.yml` 会执行完整质量检查，构建 `linux/amd64` 和 `linux/arm64` 镜像并推送以下 Tag：

```text
crpi-u11hdbc769825d1d.cn-hangzhou.personal.cr.aliyuncs.com/sxlisme/ts-live-lab:latest
crpi-u11hdbc769825d1d.cn-hangzhou.personal.cr.aliyuncs.com/sxlisme/ts-live-lab:sha-<commit>
crpi-u11hdbc769825d1d.cn-hangzhou.personal.cr.aliyuncs.com/sxlisme/ts-live-lab:<version-tag>
```

GitHub 仓库必须配置以下 Actions Repository Secrets：

- `ALIYUN_ACR_REGISTRY`
- `ALIYUN_ACR_USERNAME`
- `ALIYUN_ACR_PASSWORD`
- `ALIYUN_ACR_NAMESPACE`

生产服务器不需要访问 GitHub，也不需要重新构建源代码。服务器只需保存 `.env` 和纯镜像版 `docker-compose.yml`，登录 ACR 后执行：

```bash
cd /opt/ts-live-lab
docker compose pull
docker compose up -d --no-build
docker compose ps
curl -fsS http://127.0.0.1:8787/api/health
```

Compose 默认将服务映射为：

```text
服务器 127.0.0.1:8787 -> 容器 0.0.0.0:8787
```

这意味着：

- 服务器本机可以访问 `http://127.0.0.1:8787`。
- 外部浏览器不能访问 `http://0.0.0.0:8787`。
- `0.0.0.0` 只是监听地址，浏览器应访问服务器公网 IP 或域名。
- 正式环境由 Nginx 监听公网 `80/443`，再转发到 `127.0.0.1:8787`。
- 使用 Nginx 时不应在阿里云安全组中开放 `8787`。

更新并查看日志：

```bash
cd /opt/ts-live-lab
docker compose pull
docker compose up -d --no-build
docker compose logs -f --tail=100 app
```

## 环境变量

| 变量                       | 默认值                      | 作用                                             |
| -------------------------- | --------------------------- | ------------------------------------------------ |
| `APP_IMAGE`                | 当前 ACR `latest` 镜像      | Compose 拉取的镜像地址                           |
| `BIND_ADDRESS`             | `127.0.0.1`                 | 宿主机端口绑定地址                               |
| `WEB_PORT`                 | `8787`                      | 宿主机应用端口                                   |
| `PORT`                     | `8787`                      | 容器内 API 和生产页面端口                        |
| `HOST`                     | `127.0.0.1`                 | Node.js API 监听地址，Compose 会覆盖为 `0.0.0.0` |
| `ANTHROPIC_API_KEY`        | 空                          | 服务器持有的 Claude 或兼容接口 Key               |
| `ANTHROPIC_BASE_URL`       | `https://api.anthropic.com` | 服务器 Key 使用的固定上游地址                    |
| `CLAUDE_MODEL`             | `claude-sonnet-4-20250514`  | 默认模型 ID，也支持第三方自定义 ID               |
| `ALLOW_CLIENT_AI_KEY`      | `true`                      | 是否接受设置页面提供的临时 Key                   |
| `ALLOW_CLIENT_AI_BASE_URL` | `true`                      | 是否允许用户选择经过安全校验的公共 HTTPS 上游    |
| `AI_ALLOWED_BASE_URLS`     | 空                          | 可选的上游完整地址白名单，多个用逗号分隔         |
| `ALLOWED_ORIGIN`           | `http://localhost:5173`     | 允许的浏览器来源，多个用逗号分隔                 |
| `TRUST_PROXY`              | `false`                     | 是否信任一层反向代理传递的客户端 IP              |
| `HTTPS_ONLY`               | `false`                     | 是否启用 HSTS 并自动把页面资源升级为 HTTPS       |

公开部署并启用服务器 AI Key 前，请阅读 [SECURITY.md](./SECURITY.md)。

## 扩展项目

- 题目由 `src/data/questions.ts` 汇总，具体题库位于 `src/data/questionBanks/`。新增 `PracticeQuestion` 后，列表、筛选、进度、运行器和 AI 审查会自动适配；`src/data/content.test.ts` 会确保至少存在 50 道 ID 唯一且结构有效的题目。
- TypeScript 文档章节位于 `src/data/docs/`。每章需要包含官方来源 URL，并通过 `src/types/docs.ts` 中的统一数据结构渲染。
- Web 预览组装和安全策略位于 `src/domain/preview/buildPreviewDocument.ts`，iframe 生命周期和心跳检测位于 `src/components/preview/PreviewFrame.vue`。
- 运行沙箱策略位于 `src/domain/runner/security.ts`，Worker 调度位于 `src/composables/useCodeRunner.ts`。
- AI 前端请求位于 `src/services/aiReview.ts`，服务端路由位于 `server/routes/ai.ts`；上游地址标准化、网络地址检查和 DNS 固定逻辑位于 `server/aiBaseUrl.ts`。
- 通用 UI 组件放在 `src/components/ui`，业务组件保留在各自功能目录中。

## 质量检查命令

```bash
npm run lint
npm run test
npm run test:e2e
npm run typecheck
npm run build
npm run check
```

首次运行浏览器测试前执行 `npx playwright install chromium`。`test:e2e` 默认会启动本地服务，也可以通过 `E2E_BASE_URL` 指向已经运行的环境。

项目中的中文 TypeScript 手册是基于 TypeScript 公开概念编写的原创中文内容，不是对官方网站的直接镜像。每章保留官方资料来源，便于后续跟踪 TypeScript 版本变化并保持项目可分发。
