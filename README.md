# Shihao Notes

一个无需后端的个人博客，使用 React + Vite 构建，适合部署在 GitHub Pages。

## 本地预览

```bash
npm install
npm run dev
```

## 发布到 GitHub Pages

1. 在 GitHub 新建一个仓库，并将本目录推送到 `main` 分支。
2. 进入仓库 **Settings → Pages**，将 Source 设为 **GitHub Actions**。
3. 每次推送到 `main`，GitHub 将自动执行 `.github/workflows/deploy.yml` 并发布网站。

博客内容当前集中在 `src/main.tsx` 的 `posts` 数据中，修改后推送即可更新。上线前请把“关于我”里的邮箱替换为自己的联系方式。
