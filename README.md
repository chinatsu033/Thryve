# Thryve

中文心理状态打卡与就医总结工具（Vite + React + TypeScript + **Supabase 邮箱登录 / 云端同步**）。  
**本工具仅用于个人状态记录与就医沟通，不能替代专业医疗诊断或治疗。**

生产站点（Cloudflare）：  
https://thryve.chinatsu033.org

## 功能概览

- **邮箱注册 / 登录**：Supabase Auth（email + password），注册需 Cloudflare Turnstile；会话持久化
- **云端同步**：情绪 / 睡眠 / 饮食按 `auth.uid()` 隔离（RLS）
- **情绪**：当下感受，评分、标签、来源、备注
- **身心**：睡眠与轻量饮食打卡
- **就医总结**：7 / 14 / 30 / 自定义区间、趋势图、情绪日历、复制文字、打印
- **主题**：按账户 `profiles.theme` 保存
- **导出 / 导入**：从云端导出 JSON；导入合并到当前账户
- **附件**：MVP 暂未开放云端 Storage

## 技术栈

- Vite 8 + React 19 + TypeScript
- React Router（`basename: /`，适配 Cloudflare 根域名）
- Supabase Auth + Postgres（RLS）
- Framer Motion、Recharts、date-fns

> 历史 GitHub Pages 路径为 `/Thryve/`；现默认 `base: '/'` 用于 `thryve.chinatsu033.org`。

## 版本

**Ver 0.1（v0.1.0）**

- 新增用药日历
- 修改主页上滑返回开始页过于灵敏问题

## 环境变量

复制 `.env.example` 为 `.env`（**不要提交真实密钥**）：

```bash
VITE_SUPABASE_URL=https://srhoswkgjxqmasmaqjfg.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
```

Cloudflare Pages → Settings → Environment variables：

| Variable | Scope | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Build + Functions | Public Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Build | Public anon key only |
| `VITE_TURNSTILE_SITE_KEY` | Build | Turnstile site key (widget) |
| `TURNSTILE_SECRET_KEY` | Functions (Production/Preview) | Turnstile secret — never `VITE_` |
| `SUPABASE_SERVICE_ROLE_KEY` | Functions only | Admin create-user — never expose to client |
| `SUPABASE_URL` | Functions (optional) | If unset, Function falls back to `VITE_SUPABASE_URL` |

注册走 Pages Function `POST /api/register`（Turnstile 校验 + Admin API 建用户），客户端不再调用 `supabase.auth.signUp`。就绪后请在 Supabase Dashboard → Authentication → Providers/Settings **关闭公开注册（open signups）**，防止绕过 widget 直连 anon signUp。

## Supabase 配置（部署前必做）

1. **应用迁移**  
   SQL 文件：`supabase/migrations/20260921_init_cloud_schema.sql`  
   可用 MCP `apply_migration`（project_id `srhoswkgjxqmasmaqjfg`）或 Dashboard SQL Editor。

2. **Auth URL**（Authentication → URL Configuration）  
   - Site URL：`https://thryve.chinatsu033.org`  
   - Redirect URLs 另加：`http://localhost:5173/**`、`http://127.0.0.1:5173/**`

3. **获取 anon key**  
   Project Settings → API → `anon` `public`，填入 `VITE_SUPABASE_ANON_KEY`（切勿使用 service_role）。

4. （可选）关闭「Confirm email」以便注册后立刻登录，或保留验证并配置邮件模板。

## 本地运行

```bash
cp .env.example .env   # 填入真实 anon key
npm install
npm run dev
```

构建：

```bash
npm run build
npm run preview
```

构建时若未设置 env，客户端会优雅降级（登录页提示未配置）；生产部署必须注入真实变量。

## 部署到 Cloudflare Pages

1. 连接仓库 `chinatsu033/Thryve`，构建命令 `npm run build`，输出目录 `dist`。
2. 设置环境变量（见上表）：至少 `VITE_SUPABASE_*`、`VITE_TURNSTILE_SITE_KEY`，以及 Function 密钥 `TURNSTILE_SECRET_KEY`、`SUPABASE_SERVICE_ROLE_KEY`。
3. 自定义域：`thryve.chinatsu033.org`（根路径，`base: '/'`）。
4. SPA 回退：将所有路由指向 `index.html`。

## 隐私说明

- 数据存储在你的 Supabase 项目中，由 RLS 限制为仅本人可读写。
- 请勿在公共电脑保持登录；退出请用「设置 → 退出登录」。
- 本工具不能替代专业医疗诊断或治疗。

## 目录

```
functions/
  api/          # Pages Functions（如 register + Turnstile）
src/
  components/   # UI、流程表单、Turnstile
  context/      # Auth + 主题
  lib/          # supabase、云端 CRUD、theme
  pages/        # 各功能页
  types/        # 类型与预设
supabase/
  migrations/   # Postgres + RLS
```

## License

MIT
