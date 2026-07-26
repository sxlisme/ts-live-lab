# TypeRoom

TypeRoom is a maintainable Vue 3 + TypeScript workspace for running TS/JS in the browser, previewing HTML/CSS/JS, practicing TypeScript interview questions, reviewing answers with Claude, and reading a structured Chinese TypeScript handbook.

## Features

- Live TypeScript and JavaScript execution with streamed console output
- Disposable Web Worker sandbox with a 2-second kill switch and blocked network capabilities
- Isolated HTML/CSS/JavaScript preview with responsive viewports, console capture, and loop guards
- 50-question interview bank with choice, short-answer, and executable coding questions
- Browser-local progress and answer persistence
- Claude review proxy with schema validation, payload limits, and rate limiting
- 16-chapter Chinese TypeScript handbook with grouped navigation, examples, and official sources
- Responsive operational UI for desktop and mobile

## Stack

- Web: Vue 3, TypeScript, Vite, Vue Router, CodeMirror 6
- API: Node.js 20, Express 5, Anthropic SDK, Zod
- Quality: vue-tsc, ESLint, Vitest, Prettier

## Local development

Requirements: Node.js 20.19 or later.

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` to the API process on port `8787`.

The application runs without a Claude key. To enable AI review, either set `ANTHROPIC_API_KEY` in `.env` or allow a temporary key from the AI settings page with `ALLOW_CLIENT_AI_KEY=true`.

## Production

```bash
npm run check
NODE_ENV=production npm start
```

`npm run build` emits the web bundle to `dist/` and the API to `dist-server/`. The production API serves both. Set `HOST=0.0.0.0` when running in a container or behind a reverse proxy.

Docker is also supported:

```bash
docker build -t typeroom .
docker run --rm -p 8787:8787 --env-file .env typeroom
```

### Alibaba Cloud ACR deployment

Pushes to `main` and `v*` tags run `.github/workflows/docker-image.yml`. The workflow runs the full quality gate, builds `linux/amd64` and `linux/arm64`, and publishes these tags:

```text
crpi-u11hdbc769825d1d.cn-hangzhou.personal.cr.aliyuncs.com/sxlisme/ts-live-lab:latest
crpi-u11hdbc769825d1d.cn-hangzhou.personal.cr.aliyuncs.com/sxlisme/ts-live-lab:sha-<commit>
crpi-u11hdbc769825d1d.cn-hangzhou.personal.cr.aliyuncs.com/sxlisme/ts-live-lab:<version-tag>
```

The GitHub repository must define `ALIYUN_ACR_REGISTRY`, `ALIYUN_ACR_USERNAME`, `ALIYUN_ACR_PASSWORD`, and `ALIYUN_ACR_NAMESPACE` Actions secrets.

Prepare the ECS deployment directory from this checkout:

```bash
mkdir -p /opt/ts-live-lab
scp docker-compose.yml .env.example root@<server>:/opt/ts-live-lab/
```

On the server, create the runtime configuration and log in to ACR:

```bash
cd /opt/ts-live-lab
cp .env.example .env
vi .env

docker login \
  --username='<ACR username>' \
  crpi-u11hdbc769825d1d.cn-hangzhou.personal.cr.aliyuncs.com

docker compose pull
docker compose up -d --no-build
docker compose ps
curl -fsS http://127.0.0.1:8787/api/health
```

The Compose service binds to `127.0.0.1:8787` by default. Put Nginx or Caddy in front of it for HTTPS. Set `ALLOWED_ORIGIN` to the public HTTPS origin and `TRUST_PROXY=true`. Do not expose `8787` in the cloud security group when a reverse proxy is used.

Update and inspect the deployment with:

```bash
cd /opt/ts-live-lab
docker compose pull
docker compose up -d --no-build
docker compose logs -f --tail=100
```

## Configuration

| Variable                   | Default                     | Purpose                                               |
| -------------------------- | --------------------------- | ----------------------------------------------------- |
| `PORT`                     | `8787`                      | API and production web port                           |
| `HOST`                     | `127.0.0.1`                 | API bind address                                      |
| `ANTHROPIC_API_KEY`        | empty                       | Server-owned Claude key                               |
| `ANTHROPIC_BASE_URL`       | `https://api.anthropic.com` | Server-owned Anthropic-compatible API base URL        |
| `CLAUDE_MODEL`             | `claude-sonnet-4-20250514`  | Default Claude model ID                               |
| `ALLOW_CLIENT_AI_KEY`      | `true`                      | Accept a session-only key from the UI                 |
| `ALLOW_CLIENT_AI_BASE_URL` | `true`                      | Let browser-owned keys select a validated public host |
| `AI_ALLOWED_BASE_URLS`     | empty                       | Optional comma-separated exact base URL allowlist     |
| `ALLOWED_ORIGIN`           | `http://localhost:5173`     | Comma-separated CORS origins                          |
| `TRUST_PROXY`              | `false`                     | Trust one reverse proxy hop for client IPs            |

For a public deployment, read [SECURITY.md](./SECURITY.md) before enabling a server-owned AI key.

## Extending the project

- Questions are assembled in `src/data/questions.ts` from `src/data/questionBanks/`. Add a `PracticeQuestion`; the list, filters, progress, runner, and AI review adapt automatically. `src/data/content.test.ts` enforces at least 50 valid, uniquely identified questions.
- Handbook chapters live in `src/data/docs/`. Each chapter must include an official source URL and is rendered through the shared document schema in `src/types/docs.ts`.
- Web preview assembly and security policy live in `src/domain/preview/buildPreviewDocument.ts`; iframe lifecycle and heartbeat handling live in `src/components/preview/PreviewFrame.vue`.
- Sandbox policy is isolated in `src/domain/runner/security.ts`; worker orchestration is in `src/composables/useCodeRunner.ts`.
- AI transport is split between `src/services/aiReview.ts` and `server/routes/ai.ts`; upstream URL normalization, network checks, and DNS pinning live in `server/aiBaseUrl.ts`.
- Shared UI primitives are under `src/components/ui`; domain components stay in their feature folders.

## Quality commands

```bash
npm run lint
npm run test
npm run test:e2e
npm run typecheck
npm run build
npm run check
```

首次运行浏览器测试前执行 `npx playwright install chromium`。`test:e2e` 默认会启动本地服务，也可通过 `E2E_BASE_URL` 指向已经运行的环境。

The Chinese handbook is an original Chinese rewrite based on TypeScript's public concepts, not a mirrored copy of the official website. This keeps the project distributable and makes version updates explicit through per-chapter source links.
