# Thryve

本地优先的中文心理状态打卡与就医总结工具（Vite + React + TypeScript）。  
**本工具仅用于个人状态记录与就医沟通，不能替代专业医疗诊断或治疗。**

在线演示（需开启 GitHub Pages）：  
https://chinatsu033.github.io/Thryve/

## 功能概览

- **本地多档案**：名称 + 密码（Web Crypto PBKDF2 哈希），各档案 IndexedDB 数据隔离
- **首次引导**：可选病史，或点「我不愿意向其他人透露」跳过（设置中可改）
- **情绪**：当下感受 / 全天总结，评分 1–10、标签、备注
- **身心**：睡眠与轻量饮食打卡
- **就医总结**：7 / 14 / 30 / 自定义区间、Recharts 趋势图、情绪日历热力图、自动要点、复制文字、打印 CSS、PDF/图片附件存 IndexedDB
- **主题**：Material 风格圆角扁平 UI，预设 + 色板，CSS 变量按档案保存
- **导出 / 导入**：按档案 JSON 备份迁移

## 技术栈

- Vite 8 + React 19 + TypeScript
- React Router（`basename: /Thryve`，适配 GitHub Pages）
- Framer Motion、Recharts、idb、date-fns
- **无后端**，数据仅在浏览器本地

## 本地运行

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
npm run preview
```

> **Base path**：生产构建使用 `base: '/Thryve/'`（见 `vite.config.ts`）。  
> 若部署到站点根路径，请改为 `base: '/'`，并把 `BrowserRouter` 的 `basename` 去掉或改为 `'/'`。

## 部署到 GitHub Pages

1. 推送 `main` 分支（本仓库已配置好 base path）。
2. 仓库 **Settings → Pages**：
   - Source：`Deploy from a branch`
   - Branch：`main`，文件夹选 **`/docs`** 或使用 Actions；若用分支直出，可把 `dist` 内容发布到 `gh-pages` 分支，或启用 GitHub Action。
3. **推荐方式（静态分支）**：

```bash
npm run build
# 将 dist 推到 gh-pages 分支，例如：
npx gh-pages -d dist
```

或在 Pages 设置中使用 **GitHub Actions** 工作流自动构建 `dist`。

4. 访问：`https://chinatsu033.github.io/Thryve/`

`public/404.html` 提供简单的 SPA 路由回退（刷新子路径时回到首页并恢复 URL）。

## 隐私说明

- 数据保存在本机浏览器 **IndexedDB**，不会上传服务器。
- 密码仅存哈希，清除站点数据或换设备会丢失记录，请用「设置 → 导出」备份。
- 请勿在公共电脑上留下敏感信息；用完可退出并考虑删除档案。

## 开发说明

```
src/
  components/   # UI、布局
  context/      # 登录态与主题
  lib/          # crypto、IndexedDB、theme
  pages/        # 各功能页
  types/        # 类型与预设
```

## License

MIT
