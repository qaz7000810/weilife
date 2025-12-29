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
      // 解析 payload
      const { tab, region } = await req.json();

      // *** 用 GitHub Pages 的 raw json 路徑 ***
      const DATA_BASE = "https://susan-33333.github.io/climate_quiz/data";

      async function loadJson(file: string) {
        const url = `${DATA_BASE}/${file}`;
        const resp = await fetch(url);
        if (!resp.ok) return null;
        return await resp.json();
      }

      const [janTemp, julTemp, rainDays, rainIntensity, hotExtreme] = await Promise.all([
        loadJson("1月月均溫.json"),
        loadJson("7月月均溫.json"),
        loadJson("雨日.json"),
        loadJson("雨日降雨強度分類.json"),
        loadJson("極端高溫持續指數.json"),
      ]);

      // 氣候摘要
      const summary = {
        "最冷月均溫": janTemp?.[region]?.["1月月均溫_基期"] && janTemp?.[region]?.["1月月均溫_GWL4.0"]
          ? `${janTemp[region]["1月月均溫_基期"]}°C → ${janTemp[region]["1月月均溫_GWL4.0"]}°C`
          : "資料不足",
        "最熱月均溫": julTemp?.[region]?.["7月月均溫_基期"] && julTemp?.[region]?.["7月月均溫_GWL4.0"]
          ? `${julTemp[region]["7月月均溫_基期"]}°C → ${julTemp[region]["7月月均溫_GWL4.0"]}°C`
          : "資料不足",
        "年均雨日數": rainDays?.[region]?.["雨日rr1_基期"] && rainDays?.[region]?.["雨日rr1_GWL4.0"]
          ? `${rainDays[region]["雨日rr1_基期"]}天 → ${rainDays[region]["雨日rr1_GWL4.0"]}天`
          : "資料不足",
        "雨日降雨強度分類": rainIntensity?.[region]?.["雨日降雨強度分類"] ?? "資料不足",
        "年極端高溫日數": hotExtreme?.[region]?.["極端高溫_基期"] && hotExtreme?.[region]?.["極端高溫_GWL4.0"]
          ? `${hotExtreme[region]["極端高溫_基期"]}天 → ${hotExtreme[region]["極端高溫_GWL4.0"]}天`
          : "資料不足",
      };
      const summaryStr = Object.entries(summary).map(([k, v]) => `- ${k}：${v}`).join('\n');

      // 各tab的prompt
      let userPrompt = '';
const regionName = region.replace(/_/g, " ");

if (tab === "交通") {
  userPrompt = `
現在是西元 2055 年，你是一位住在「${regionName}」的交通與氣候生活顧問。根據以下當地氣候變遷趨勢摘要，請為居民提供2點交通出行建議：

${summaryStr}

請參考以下指標的生活影響：
- 1月月均溫：是否仍需應對低溫或已明顯回暖
- 7月月均溫：高溫是否影響白天通勤與室外移動
- 雨日與強降雨：可能導致出行不便、淹水、交通延誤
- 極端高溫持續日數：是否需避免長時間暴露於戶外

撰寫要求：
1. 具體描述這些氣候變化如何影響通勤、上下學、出遊等日常交通情境。
2. 用生活化語言舉例調適行為（如：提早出門、搭乘捷運、避開午後大雷雨等）。
3. 提供兩點建議，並在結尾加上一句貼心提醒或鼓勵語。
`;
} else if (tab === "旅遊") {
  userPrompt = `
時間是西元 2055 年，你是一位專業旅遊顧問，協助前往「${regionName}」的遊客適應氣候變遷下的旅行安排。請根據以下當地氣候趨勢摘要，提供具體旅遊建議：

${summaryStr}

你可考量的氣候特徵包含：
- 冬季與夏季氣溫：是否太熱／太冷，不適合戶外活動
- 雨日與雨強：行程安排是否需避開午後或特定季節
- 極端熱浪：是否影響戶外景點／需安排休息與遮蔭處

撰寫要求：
1. 依照使用者的地區推薦附近的旅遊景點
1. 提出旅遊活動／時段／交通方式上的具體建議（例如清晨出發、有遮蔽步道、攜帶防水裝備）。
2. 至少提供兩點，並加入能讓遊客安心與期待的收尾提醒。
`;
} else {
  userPrompt = `
現在是西元 2055 年，你是一位住在「${regionName}」的在地生活顧問。根據以下氣候變遷摘要，請為居民提供三項居住調適建議：

${summaryStr}

可考量的氣候變化包括：
- 冬夏氣溫差異：是否需加強通風、遮陽或保暖
- 雨日與強降雨頻率：是否易淹水、積水，需做防災準備
- 高溫持續天數：是否影響家中老人、小孩、寵物健康

撰寫要求：
1. 給出具體生活化的做法（如：裝設遮陽簾、防水閘門、加強屋頂排水、使用節能設備等）。
2. 至少兩點，語氣親切實用，結尾加入貼心鼓勵或安心語句。
`;
}


      // 串接 OpenAI GPT
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
            { role: "system", content: "你是一位專業科普作家，專門把台灣氣候趨勢轉為民眾容易懂的生活建議。請用繁體中文回答。" },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      const data = await openAIRes.json();
      const advice = data?.choices?.[0]?.message?.content || "⚠️ 內容生成失敗，請稍後再試。";

      return new Response(JSON.stringify({ result: advice }), {
        status: 200,
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("AI 建議 API 錯誤：", err);
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
