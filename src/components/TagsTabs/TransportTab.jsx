import React from "react";
import RingChart from "./RingChart";
import { marked } from "marked";



// 各檔案需正確路徑
import janTemp from "../../data/1月月均溫.json";
import julTemp from "../../data/7月月均溫.json";
import rainIntensity from "../../data/雨日降雨強度分類.json";
import rainDays from "../../data/雨日.json";
import hotExtreme from "../../data/極端高溫持續指數.json"; // 其實是TX90p（極端高溫天數）

const TransportTab = ({ data, regionDisplay, advice, loading, userData }) => {
  const getRegionKey = () => {
    if (userData?.county && userData?.town) {
      return `${userData.county.trim()}_${userData.town.trim()}`;
    }
    if (regionDisplay) {
      return regionDisplay.replace(/\s/g, "_").trim();
    }
    return "";
  };
  const regionKey = getRegionKey();

  const jan = janTemp[regionKey] || {};
  const jul = julTemp[regionKey] || {};
  const rain = rainDays[regionKey] || {};
  const rainInt = rainIntensity[regionKey]?.雨日降雨強度分類 || "";
  const hotExtremeBase = hotExtreme[regionKey]?.["極端高溫_基期"];
  const hotExtremeFuture = hotExtreme[regionKey]?.["極端高溫_GWL4.0"];
  const hotExtremeChange = hotExtreme[regionKey]?.["極端高溫_CHANGE"];

  const rainBase = rain["雨日rr1_基期"];
  const rainFuture = rain["雨日rr1_GWL4.0"];
  const rainChange = rain["雨日rr1_CHANGE"];
  let rainDesc = "";
  if (rainBase && rainFuture && rainChange) {
    const changeNum = parseInt(rainChange, 10);
    rainDesc = changeNum > 0
      ? `增加 ${changeNum} 天`
      : changeNum < 0
      ? `減少 ${Math.abs(changeNum)} 天`
      : "變化不大";
  } else {
    rainDesc = "資料不足";
  }

  let rainLevelStr = "";
  let rainLevelIcon = "";
  let rainLevelColor = "";
  if (rainInt === "高") {
    rainLevelStr = "，降雨事件偏劇烈，外出請注意突發性大雨。";
    rainLevelIcon = "⛈️";
    rainLevelColor = "text-red-600";
  } else if (rainInt === "中") {
    rainLevelStr = "，降雨強度中等，需留意午後或梅雨時期的天氣。";
    rainLevelIcon = "🌦️";
    rainLevelColor = "text-yellow-600";
  } else if (rainInt === "低") {
    rainLevelStr = "，降雨偏溫和，平時外出較少遇到強降雨。";
    rainLevelIcon = "🌧️";
    rainLevelColor = "text-blue-600";
  } else {
    rainLevelStr = "降雨強度資料不足。";
    rainLevelIcon = "❓";
    rainLevelColor = "text-gray-400";
  }

  let hotExtremeStr = "";
  if (hotExtremeBase && hotExtremeFuture && hotExtremeChange) {
    const base = parseFloat(hotExtremeBase);
    const fut = parseFloat(hotExtremeFuture);
    const diff = parseFloat(hotExtremeChange);
    hotExtremeStr = `未來每年極端高溫日數將從 ${base} 天大幅上升到 ${fut} 天，增加 ${diff} 天。這將使夏季熱浪、悶熱日明顯增加，交通舒適度大幅下降。`;
  } else {
    hotExtremeStr = "資料不足。";
  }

  // ✅ 清理 escape 星號字元，避免 ** 被誤解
  const adviceClean = (advice || "").replace(/\\\*/g, "*");

  return (
    <div className="flex flex-col items-center space-y-4 pt-4 text-left w-full max-w-[850px] mx-auto">
      <h2 className="text-xl font-bold text-gray-800">
        未來 30 年，你在 {regionKey.replace(/_/g, " ")} 的出行舒適度
      </h2>
      <RingChart score={data.score} />

      <div className="bg-white rounded-lg shadow p-3 w-full mt-2">
        <p className="text-base font-semibold mb-2">🌡️ 氣候趨勢摘要</p>
        <ul className="space-y-2 text-sm leading-relaxed">
          <li>
            最冷月均溫：
            {jan["1月月均溫_基期"] ?? "—"}°C →
            <b className="text-red-600">{jan["1月月均溫_GWL4.0"] ?? "—"}</b>°C
            {jan["1月月均溫_CHANGE"] && (
              <span className="text-gray-500">（升高 {jan["1月月均溫_CHANGE"]}°C）</span>
            )}
          </li>
          <li>
            最熱月均溫：
            {jul["7月月均溫_基期"] ?? "—"}°C →
            <b className="text-red-600">{jul["7月月均溫_GWL4.0"] ?? "—"}</b>°C
            {jul["7月月均溫_CHANGE"] && (
              <span className="text-gray-500">（升高 {jul["7月月均溫_CHANGE"]}°C）</span>
            )}
          </li>
          <li>
            年均雨日數：{rainBase ?? "—"} 天 →
            <b className="text-blue-600">{rainFuture ?? "—"}</b> 天
            <span className="text-gray-500 ml-2">{rainDesc}</span>
          </li>
          <li>
            <span className="inline-block w-4">{rainLevelIcon}</span>
            <span className={rainLevelColor + " font-bold"}>
              雨日降雨強度：{rainInt || "—"}
            </span>
            <span className="ml-2 text-xs text-gray-500">{rainLevelStr}</span>
          </li>
          <li>
            年極端高溫日數：{hotExtremeBase ?? "—"} 天 →
            <b className="text-red-600">{hotExtremeFuture ?? "—"}</b> 天
            {hotExtremeChange && (
              <span className="text-gray-500">（增加 {hotExtremeChange} 天）</span>
            )}
            <div className="text-xs text-gray-500">{hotExtremeStr}</div>
          </li>
        </ul>
      </div>

      {/* ✅ AI 建議區塊（使用 marked 套用 markdown） */}
      <div className="w-full mt-2 bg-gray-100 rounded-md p-2">
        <h3 className="text-sm font-bold mb-1">🤖 AI 建議</h3>
        {loading ? (
          <p className="text-gray-400 animate-pulse">正在產生建議...</p>
        ) : (
          <div
            className="text-sm text-gray-700 leading-snug whitespace-pre-wrap markdown-content"
            dangerouslySetInnerHTML={{
              __html: marked.parse(adviceClean || "尚無建議。"),
            }}
          />
        )}
      </div>
      
      {/* 🔗 延伸閱讀連結 */}
      <p className="text-sm text-blue-600 underline mt-4">
        <a
          href="https://tccip.ncdr.nat.gov.tw/km_column_one.aspx?kid=20240913115504"
          target="_blank"
          rel="noopener noreferrer"
        >
          深入占卜：全球沸騰 (Global Boiling) 的時代
  

        </a>
      </p>
    </div>
  );
};

export default TransportTab;
