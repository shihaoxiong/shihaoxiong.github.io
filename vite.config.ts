import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/xiaodan-notes/" : "/",
  server: { host: "127.0.0.1" },
});
