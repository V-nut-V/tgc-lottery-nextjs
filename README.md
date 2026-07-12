# TGC Lottery (抽奖)

An in-store lottery app for TGC retail locations. A cashier or customer enters
an invoice number and the amount spent; the app calculates how many draws
that purchase earns (based on the store's minimum spend threshold), spins a
prize from the store's prize pool, and records the result to draw history.
Each store's configuration (prize pool, background image, minimum spend,
PIN, layout) is managed on the `/store` screen and fetched from a GraphQL
backend (Strapi-style schema: `stores`, `histories`).

Built with Next.js (App Router), Ant Design, styled-components, and Apollo
Client.

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [React 19](https://react.dev/)
- [Apollo Client 4](https://www.apollographql.com/docs/react/) + `@apollo/client-integration-nextjs` for GraphQL data fetching
- [Ant Design 5](https://ant.design/) for UI components
- [styled-components](https://styled-components.com/) for component styling
- [dayjs](https://day.js.org/) for date formatting

## Getting Started

Requirements: Node.js 20.9+ (Node 22/24 recommended) and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app. The
lottery screen lives at `/`, and store configuration lives at `/store`.

## Environment Variables

Create a `.env` file in the project root (see `.gitignore` — `.env*` files
are not committed):

| Variable | Required at | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Build & runtime | Base URL of the GraphQL backend. Exposed to the browser and appended with `/graphql` in `src/lib/ApolloClient.js` / `src/lib/ApolloWrapper.jsx`. Because it's a `NEXT_PUBLIC_` variable, it is inlined into the client bundle **at build time** — see the Docker note below. |
| `RETAIL_BASE_URL` | Runtime | Retail/POS integration base URL. |
| `RETAIL_APP_ID` | Runtime | Retail/POS integration app ID. |
| `RETAIL_APP_SECRET` | Runtime | Retail/POS integration app secret. |
| `RETAIL_BRAND_ID` | Runtime | Retail/POS integration brand ID. |

## Available Scripts

```bash
npm run dev     # start the dev server (Turbopack)
npm run build   # production build
npm run start   # run the production build
npm run lint    # run ESLint
```

## Deployment

The app is deployed as a Docker container on a self-managed server (no
Vercel/PaaS involved). There is no `Dockerfile` committed to this repo yet —
the setup below is the documented process to follow. `next.config.mjs`
already sets `output: "standalone"`, so a production image only needs the
traced server bundle, not the full `node_modules`/`.next` tree.

### Dockerfile

Create a `Dockerfile` like this at the project root:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-alpine AS base

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* variables are inlined into the client bundle at build time,
# so they must be passed as build args, not just runtime env vars.
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Run ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
```

Add a `.dockerignore` next to it so the build context stays small:

```
node_modules
.next
.git
.env
.env*.local
```

### Build and run with Docker

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com \
  -t lottery-nextjs .

docker run -d \
  --name lottery-nextjs \
  -p 3000:3000 \
  --env-file .env \
  lottery-nextjs
```

> **Important:** `NEXT_PUBLIC_API_BASE_URL` is baked into the client
> JavaScript bundle at build time. Passing it via `--env-file` at
> `docker run` is **not** enough — it must be supplied as a `--build-arg`
> (as above), otherwise the browser bundle will be built without it. The
> other, non-`NEXT_PUBLIC_` variables (`RETAIL_*`) are only read at
> runtime, so `--env-file` / `docker run -e` is sufficient for those.

### Optional: Docker Compose

If you'd rather not type the `docker build`/`docker run` flags every time,
a `docker-compose.yml` like this covers the same setup:

```yaml
services:
  lottery-nextjs:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_BASE_URL: ${NEXT_PUBLIC_API_BASE_URL}
    image: lottery-nextjs:latest
    container_name: lottery-nextjs
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
```

```bash
docker compose up -d --build
```

### Reverse proxy

The container listens on port `3000`. Put a reverse proxy (nginx, Caddy,
etc.) in front of it for TLS termination and a stable domain — this is not
part of the app and should be configured on the host.

## Project Structure

```
src/
  app/
    page.jsx           # lottery draw screen ("/")
    store/page.jsx      # store configuration screen ("/store")
    manifest.js          # PWA manifest
    layout.jsx
  components/
  lib/
    ApolloClient.js      # imperative Apollo Client (client.query/mutate)
    ApolloWrapper.jsx     # Apollo provider for the App Router
    StoreContextProvider.jsx.jsx  # store data + GraphQL queries/mutations
    SettingsContextProvider.jsx   # local UI settings (e.g. font size)
    lottery.js            # prize drawing logic
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Docker deployment guide](https://nextjs.org/docs/app/getting-started/deploying#docker)

---

# TGC 抽奖

面向 TGC 门店线下场景的抽奖应用。收银员或顾客输入小票号码和消费金额，
系统会根据门店设置的最小消费额度计算可抽奖次数，从该门店的奖品池中抽取
奖品，并把结果记入抽奖历史。每个门店的配置（奖品池、背景图、最小消费额
度、验证 PIN、显示位置等）在 `/store` 页面管理，数据来自 GraphQL 后端
（Strapi 风格的 schema：`stores`、`histories`）。

技术栈：Next.js（App Router）、Ant Design、styled-components、Apollo
Client。

## 技术栈

- [Next.js 16](https://nextjs.org/)（App Router，Turbopack）
- [React 19](https://react.dev/)
- [Apollo Client 4](https://www.apollographql.com/docs/react/) + `@apollo/client-integration-nextjs`，用于 GraphQL 数据请求
- [Ant Design 5](https://ant.design/) 组件库
- [styled-components](https://styled-components.com/) 组件样式方案
- [dayjs](https://day.js.org/) 日期格式化

## 快速开始

环境要求：Node.js 20.9 及以上（推荐 Node 22/24）、npm。

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。抽奖页面在
`/`，门店配置页面在 `/store`。

## 环境变量

在项目根目录创建 `.env` 文件（`.gitignore` 中已忽略 `.env*`，不会被提交
到仓库）：

| 变量名 | 生效阶段 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | 构建 + 运行时 | GraphQL 后端的根地址，会暴露给浏览器，在 `src/lib/ApolloClient.js` / `src/lib/ApolloWrapper.jsx` 中拼接 `/graphql`。因为是 `NEXT_PUBLIC_` 变量，会在**构建时**被打包进客户端代码——详见下方 Docker 部署的注意事项。 |
| `RETAIL_BASE_URL` | 运行时 | 零售 / POS 系统对接地址。 |
| `RETAIL_APP_ID` | 运行时 | 零售 / POS 系统对接 App ID。 |
| `RETAIL_APP_SECRET` | 运行时 | 零售 / POS 系统对接 App Secret。 |
| `RETAIL_BRAND_ID` | 运行时 | 零售 / POS 系统对接品牌 ID。 |

## 常用命令

```bash
npm run dev     # 启动开发服务器（Turbopack）
npm run build   # 生产环境构建
npm run start   # 运行生产构建
npm run lint    # 运行 ESLint 检查
```

## 部署

本项目通过 Docker 容器部署在自建服务器上（不使用 Vercel 等 PaaS 平台）。
仓库里目前还没有提交 `Dockerfile`，下面是完整的部署配置说明。
`next.config.mjs` 中已设置 `output: "standalone"`，生产镜像只需要打包后
的独立 server 产物，不需要完整的 `node_modules` 和 `.next` 目录。

### Dockerfile

在项目根目录新建一个 `Dockerfile`，内容如下：

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-alpine AS base

# ---- 安装依赖 ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- 构建 ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* 变量会在构建时被打包进客户端代码，
# 所以必须通过 build arg 传入，而不是只在运行时传环境变量。
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- 运行 ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
```

同目录下再建一个 `.dockerignore`，让构建上下文保持精简：

```
node_modules
.next
.git
.env
.env*.local
```

### 使用 Docker 构建与运行

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com \
  -t lottery-nextjs .

docker run -d \
  --name lottery-nextjs \
  -p 3000:3000 \
  --env-file .env \
  lottery-nextjs
```

> **注意：** `NEXT_PUBLIC_API_BASE_URL` 会在**构建时**被打包进浏览器端
> 的 JS 代码里。只在 `docker run` 阶段用 `--env-file` 传入是**不够的**
> ——必须像上面这样通过 `--build-arg` 在构建镜像时传入，否则打包出来的
> 前端代码里就不会包含这个地址。而其他非 `NEXT_PUBLIC_` 的变量
> （`RETAIL_*`）只在运行时读取，所以对它们来说 `--env-file` /
> `docker run -e` 就足够了。

### 可选：Docker Compose

如果不想每次都手动敲 `docker build`/`docker run` 的参数，可以建一个
`docker-compose.yml`，效果等同于上面的配置：

```yaml
services:
  lottery-nextjs:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_BASE_URL: ${NEXT_PUBLIC_API_BASE_URL}
    image: lottery-nextjs:latest
    container_name: lottery-nextjs
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
```

```bash
docker compose up -d --build
```

### 反向代理

容器内监听 `3000` 端口。如需 HTTPS 和固定域名，请在宿主机上自行配置反向
代理（nginx、Caddy 等），这部分不属于本项目范围。

## 项目结构

```
src/
  app/
    page.jsx           # 抽奖页面（"/"）
    store/page.jsx      # 门店配置页面（"/store"）
    manifest.js          # PWA manifest
    layout.jsx
  components/
  lib/
    ApolloClient.js      # 命令式 Apollo Client（client.query/mutate）
    ApolloWrapper.jsx     # App Router 用的 Apollo Provider
    StoreContextProvider.jsx.jsx  # 门店数据与 GraphQL 查询/变更
    SettingsContextProvider.jsx   # 本地 UI 设置（如字号）
    lottery.js            # 抽奖逻辑
```

## 延伸阅读

- [Next.js 官方文档](https://nextjs.org/docs)
- [Next.js Docker 部署指南](https://nextjs.org/docs/app/getting-started/deploying#docker)
