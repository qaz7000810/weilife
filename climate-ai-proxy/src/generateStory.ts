export default {
  async fetch(req: Request, env: any): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json",
        },
      });
    }

    try {
      const  { age, county, town, name }  = await req.json();
      const category = age <= 40 ? "青年" : age <= 65 ? "壯年" : "老年";
      const prompt = 
`請用小說敘事風格，撰寫一段GWL4.0 氣候變遷情境下2055年的「${category}篇」故事。主角是現在的使用者本人，描述他／她在未來生活中的一天。

請根據下列條件撰寫：
-故事發生地點為台灣「${county}${town}」，請融入當地特徵描述。
- 年齡落在 ${age} 歲，屬於「${category}」年齡階段。
- 故事背景為極端氣候頻繁（熱浪、淹水、乾旱、冬天消失、公共設施轉變等）
-輸出內容請用第二人稱(你)撰寫
- 敘事重點放在個人生活轉變、居住條件、防災行動、心理感受與對過去的對比
- 請自然流露一種「習慣了，但仍隱隱覺得可惜或無奈」的情緒，例如：
  - 青年：對「從未經歷過冬天」感到好奇與不解
  - 壯年：懷念曾經的四季與正常通勤生活
  - 老年：對未來一代的氣候教育感到愧疚或想補償
- 最後加上一句情感收尾或鼓勵話語，例如：
  「但也許，從你開始選擇，未來可以不一樣。」

輸出長度建議為 110 字內，用繁體中文撰寫。`;

      const apiKey = env.OPENAI_API_KEY;

      const openAIRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "你是一位小說型敘事生成 AI，請用繁體中文回答。" },
            { role: "user", content: prompt },
          ],
        }),
      });

      const data = await openAIRes.json();
      const story = data?.choices?.[0]?.message?.content || "⚠️ 故事生成失敗，請稍後再試。";

      return new Response(JSON.stringify({ result: story }), {
        status: 200,
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("故事 API 錯誤：", err);
      return new Response(JSON.stringify({ result: "⚠️ 發生錯誤，請稍後再試。" }), {
        status: 500,
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json",
        },
      });
    }
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://susan-33333.github.io",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
