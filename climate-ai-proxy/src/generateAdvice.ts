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
      const { tab, region } = await req.json();

      const safeTab = String(tab || "").trim();
      const safeRegion = String(region || "").trim();

      if (!safeTab || !safeRegion) {
        return new Response(
          JSON.stringify({ result: "⚠️ 缺少必要資料，請重新操作。" }),
          {
            status: 400,
            headers: {
              ...corsHeaders(origin),
              "Content-Type": "application/json",
            },
          }
        );
      }

      const DATA_BASE =
        "https://raw.githubusercontent.com/qaz7000810/weilife/main/src/data";

      async function loadJson(file: string) {
        const url = `${DATA_BASE}/${file}`;
        const resp = await fetch(url);
        if (!resp.ok) return null;
        return await resp.json();
      }

      const [janTemp, julTemp, rainDays, rainIntensity, hotExtreme] =
        await Promise.all([
          loadJson("1月月均溫.json"),
          loadJson("7月月均溫.json"),
          loadJson("雨日.json"),
          loadJson("雨日降雨強度分類.json"),
          loadJson("極端高溫持續指數.json"),
        ]);

      const summary = {
        最冷月均溫:
          janTemp?.[safeRegion]?.["1月月均溫_基期"] &&
          janTemp?.[safeRegion]?.["1月月均溫_GWL4.0"]
            ? `${janTemp[safeRegion]["1月月均溫_基期"]}°C → ${janTemp[safeRegion]["1月月均溫_GWL4.0"]}°C`
            : "資料不足",
        最熱月均溫:
          julTemp?.[safeRegion]?.["7月月均溫_基期"] &&
          julTemp?.[safeRegion]?.["7月月均溫_GWL4.0"]
            ? `${julTemp[safeRegion]["7月月均溫_基期"]}°C → ${julTemp[safeRegion]["7月月均溫_GWL4.0"]}°C`
            : "資料不足",
        年均雨日數:
          rainDays?.[safeRegion]?.["雨日rr1_基期"] &&
          rainDays?.[safeRegion]?.["雨日rr1_GWL4.0"]
            ? `${rainDays[safeRegion]["雨日rr1_基期"]}天 → ${rainDays[safeRegion]["雨日rr1_GWL4.0"]}天`
            : "資料不足",
        雨日降雨強度分類:
          rainIntensity?.[safeRegion]?.["雨日降雨強度分類"] ?? "資料不足",
        年極端高溫日數:
          hotExtreme?.[safeRegion]?.["極端高溫_基期"] &&
          hotExtreme?.[safeRegion]?.["極端高溫_GWL4.0"]
            ? `${hotExtreme[safeRegion]["極端高溫_基期"]}天 → ${hotExtreme[safeRegion]["極端高溫_GWL4.0"]}天`
            : "資料不足",
      };

      const summaryStr = Object.entries(summary)
        .map(([k, v]) => `- ${k}：${v}`)
        .join("\n");

      const regionName = safeRegion.replace(/_/g, " ");
      let userPrompt = "";

      if (safeTab === "交通") {
        userPrompt = `
你正在為「${regionName}」撰寫一段給一般使用者看的交通生活建議，背景是西元 2055 年的氣候變遷情境。

以下是當地氣候趨勢摘要：
${summaryStr}

請不要直接重複資料，而是把資料翻成「生活上會發生什麼」。

請依照以下格式輸出，使用繁體中文：

【這代表什麼】
用 2 句話說明：
- 未來在 ${regionName}，交通或移動上最值得注意的變化是什麼
- 這些變化會怎麼影響通勤、上下學、外出安排

【你可以怎麼做】
請列出 2 點具體、簡短、生活化的建議，每點 18～35 字左右。
建議要像一般人今天就能理解和採取的做法，不要太專業。

【小提醒】
最後用 1 句溫和語氣收尾，讓人感覺這不是恐嚇，而是可以提早準備。

寫作要求：
- 先講生活影響，再講建議
- 語氣像平台內容，不像公文
- 不要條列氣候指標定義
- 不要寫成旅遊文章
- 不要使用「建議民眾」「應注意」這類官樣語氣
- 全文控制在 130～180 字
        `.trim();
      } else if (safeTab === "旅遊") {
        userPrompt = `
你正在為「${regionName}」撰寫一段給一般使用者看的旅遊生活建議，背景是西元 2055 年的氣候變遷情境。

以下是當地氣候趨勢摘要：
${summaryStr}

請不要直接重複資料，而是把資料翻成「未來去這裡旅遊時，最需要注意的生活感受與安排方式」。

請依照以下格式輸出，使用繁體中文：

【這代表什麼】
用 2 句話說明：
- 未來在 ${regionName} 旅遊時，最需要注意的氣候風險是什麼
- 這會怎麼影響外出時間、活動安排或裝備準備

【你可以怎麼做】
請列出 2 點具體、簡短、生活化的建議，每點 18～35 字左右。
例如可涉及：出發時段、遮陽避雨、休息安排、交通方式、攜帶裝備。

【小提醒】
最後用 1 句讓人安心但有準備意識的收尾。

寫作要求：
- 不要虛構景點名稱
- 不要寫成觀光文案
- 先講生活影響，再講建議
- 不要使用「建議民眾」「應注意」這類官樣語氣
- 全文控制在 130～180 字
        `.trim();
      } else {
        userPrompt = `
你正在為「${regionName}」撰寫一段給一般使用者看的居住生活建議，背景是西元 2055 年的氣候變遷情境。

以下是當地氣候趨勢摘要：
${summaryStr}

請不要直接重複資料，而是把資料翻成「住在這裡的人，日常生活會感受到什麼變化」。

請依照以下格式輸出，使用繁體中文：

【這代表什麼】
用 2 句話說明：
- 未來在 ${regionName} 居住時，最值得注意的生活風險是什麼
- 這些變化會怎麼影響家中舒適度、安全感或日常安排

【你可以怎麼做】
請列出 2～3 點具體、簡短、生活化的建議，每點 18～35 字左右。
例如可涉及：遮陽、通風、排水、防積水、防熱、防潮、照顧老人小孩與寵物。

【小提醒】
最後用 1 句溫和但有行動感的收尾。

寫作要求：
- 語氣像生活化教育平台，不像公部門宣導
- 不要只寫抽象口號
- 不要直接抄氣候摘要
- 不要使用「建議民眾」「應注意」這類官樣語氣
- 全文控制在 140～190 字
        `.trim();
      }

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
                "你是氣候教育互動平台的內容編輯，擅長把台灣在地氣候趨勢翻譯成一般人能理解的生活影響與簡單調適建議。請用繁體中文回答，語氣生活化、具體、溫和，不要太像公部門宣導，也不要太像旅遊部落格。",
            },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!openAIRes.ok) {
        const errText = await openAIRes.text();
        console.error("OpenAI 建議 API 回應失敗：", errText);

        return new Response(
          JSON.stringify({ result: "⚠️ 內容生成失敗，請稍後再試。" }),
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
      const advice =
        data?.choices?.[0]?.message?.content?.trim() ||
        "⚠️ 內容生成失敗，請稍後再試。";

      return new Response(JSON.stringify({ result: advice }), {
        status: 200,
        headers: {
          ...corsHeaders(origin),
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("AI 建議 API 錯誤：", err);

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