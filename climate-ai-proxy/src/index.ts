import generateAdvice from "./generateAdvice";
import generateStory from "./generateStory";

// CORS for API
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://susan-33333.github.io", // 修改成你前端網域
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(req: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    // 預檢 OPTIONS (API 跟靜態都支援)
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    // API 路徑
    if (url.pathname === "/api/generate-advice") {
      return generateAdvice.fetch(req, env, ctx);
    }
    if (url.pathname === "/api/generate-story") {
      return generateStory.fetch(req, env, ctx);
    }

    // ⭐⭐ 其它全部交給 ASSETS (public/ 目錄下所有靜態檔案)
    // 這樣 data/*.json、index.html 直接公開可抓
    // @ts-ignore
    if (env.ASSETS && env.ASSETS.fetch) {
      return env.ASSETS.fetch(req, env, ctx);
    }

    // fallback: 保險措施（不太會用到）
    return new Response("404 Not Found", {
      status: 404,
      headers: corsHeaders(),
    });
  },
};
