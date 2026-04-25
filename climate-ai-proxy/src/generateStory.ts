export default {
  async fetch(req: Request, env: any): Promise<Response> {
    const origin = req.headers.get("Origin") || undefined;

    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: {
          ...corsHeaders(origin),
          "Content-Type": "application/json",
        },
      });
    }

    try {
      const { age, county, town, name } = await req.json();

      const numericAge = Number(age);
      const safeCounty = String(county || "").trim();
      const safeTown = String(town || "").trim();
      const safeName = String(name || "").trim();

      if (!safeCounty || !safeTown || Number.isNaN(numericAge)) {
        return new Response(
          JSON.stringify({ result: "⚠️ 缺少必要資料，請重新輸入。" }),
          {
            status: 400,
            headers: {
              ...corsHeaders(origin),
              "Content-Type": "application/json",
            },
          }
        );
      }

      const category =
        numericAge <= 40 ? "青年" : numericAge <= 65 ? "壯年" : "老年";

      const prompt = `
你是一位「氣候教育互動平台」的故事編輯，請為使用者撰寫一段適合放在網頁上的未來生活片段。

請根據以下條件寫作：
- 地點：台灣 ${safeCounty}${safeTown}
- 主角：使用者本人${safeName ? `（名字可自然帶入：${safeName}）` : ""}
- 年齡：${numericAge} 歲，屬於「${category}」
- 時間：西元 2055 年，GWL4.0 氣候變遷情境
- 用第二人稱「你」書寫
- 使用繁體中文
- 長度控制在 140～180 字
- 語氣要有畫面感，但不要太文學、太誇張、太像小說
- 這段文字要像「你未來某一天的生活片段」，讓不熟悉氣候議題的人也能快速代入

寫作目標：
1. 讓使用者感受到未來生活真的改變了
2. 自然埋入 2～3 個可辨識的氣候訊號
3. 為後面的測驗與結果頁鋪路

內容要求：
- 必須自然融入當地生活情境或地方感
- 至少出現以下元素中的任意 2～3 項：
  - 熱浪 / 高溫
  - 強降雨 / 積水 / 淹水
  - 冬天變短或幾乎消失
  - 通勤或移動方式改變
  - 旅遊或外出安排改變
  - 公共設施、防災設備、居住條件改變
- 情緒基調要是：
  「你慢慢習慣了這樣的生活，但還是會對過去熟悉的季節與生活方式感到一點可惜或無奈」
- 年齡層情緒可自然帶入：
  - 青年：對「從小就不太認識真正冬天」感到好奇與不解
  - 壯年：懷念曾經較穩定的四季與日常節奏
  - 老年：對下一代的氣候教育帶著愧疚、提醒或想補償的心情
- 最後一句要留下微弱但真誠的希望感

禁止事項：
- 不要寫成科幻小說
- 不要出現末日、世界崩壞、災難電影式描述
- 不要用條列式
- 不要直接解釋氣候指標
- 不要把主角寫成旁觀者，必須是日常生活中的本人
- 不要加標題、不要加引號、不要額外解說

請直接輸出故事正文。
`.trim();

      const apiKey = env.OPENAI_API_KEY;

      const openAIRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content:
                "你是氣候教育互動平台的內容編輯，擅長把氣候變遷寫成一般人看得懂、能代入的未來生活片段。請用繁體中文回答，語氣有畫面感但節制，不要過度文學化。",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!openAIRes.ok) {
        const errText = await openAIRes.text();
        console.error("OpenAI 故事 API 回應失敗：", errText);

        return new Response(
          JSON.stringify({ result: "⚠️ 故事生成失敗，請稍後再試。" }),
          {
            status: 502,
            headers: {
              ...corsHeaders(origin),
              "Content-Type": "application/json",
            },
          }
        );
      }

      const data = await openAIRes.json();
      const story =
        data?.choices?.[0]?.message?.content?.trim() ||
        "⚠️ 故事生成失敗，請稍後再試。";

      return new Response(JSON.stringify({ result: story }), {
        status: 200,
        headers: {
          ...corsHeaders(origin),
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("故事 API 錯誤：", err);

      return new Response(
        JSON.stringify({ result: "⚠️ 發生錯誤，請稍後再試。" }),
        {
          status: 500,
          headers: {
            ...corsHeaders(origin),
            "Content-Type": "application/json",
          },
        }
      );
    }
  },
};

function corsHeaders(origin?: string) {
  const allowed = new Set([
    "https://susan-33333.github.io",
    "https://qaz7000810.github.io",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
  ]);

  const allowOrigin = allowed.has(origin || "")
    ? origin
    : "https://qaz7000810.github.io";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
