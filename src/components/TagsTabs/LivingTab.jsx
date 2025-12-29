import React from "react";
import RingChart from "./RingChart";
import { marked } from "marked";

import rainIntensity from "../../data/雨日降雨強度分類.json";
import seaLevelRisk from "../../data/海平面上升風險.json";

const LivingTab = ({ data, regionDisplay, advice, loading, userData }) => {
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

  const rainInt = rainIntensity[regionKey]?.雨日降雨強度分類 || "資料不足";
  let rainLevelStr = "";
  if (rainInt === "高") {
    rainLevelStr = "，降雨事件偏劇烈，建議加強排水與防災準備。";
  } else if (rainInt === "中") {
    rainLevelStr = "，降雨強度中等，仍需注意集中降雨造成的影響。";
  } else if (rainInt === "低") {
    rainLevelStr = "，降雨偏溫和，適合長者生活。";
  } else {
    rainLevelStr = "降雨強度資料不足。";
  }

  const seaRisk = seaLevelRisk[regionKey]?.海平面上升風險;
  let seaLevelStr = "";
  if (seaRisk === 1) {
    seaLevelStr = "，有海平面上升風險，低窪地區須注意淹水與遷移規劃。";
  } else if (seaRisk === 0) {
    seaLevelStr = "，無明顯海平面上升風險。";
  } else {
    seaLevelStr = "資料不足。";
  }

  const adviceClean = (advice || "").replace(/\\\*/g, "*");

  return (
    <div className="flex flex-col items-center space-y-4 pt-4 text-left w-full max-w-[850px] mx-auto">
      <h2 className="text-xl font-bold text-gray-800">
        未來 30 年，你在 {regionKey.replace(/_/g, " ")} 的居住安全性
      </h2>
      <RingChart score={data.score} />
      <div className="bg-white rounded-lg shadow p-3 w-full mt-2">
        <p className="text-base font-semibold mb-2">🏡 氣候趨勢摘要</p>
        <ul className="space-y-1 text-sm">
          <li>
            <span>
              雨日降雨強度分類：<b>{rainInt}</b>
              <span className="ml-2 text-xs text-gray-500">{rainLevelStr}</span>
            </span>
          </li>
          <li>
            <span>
              海平面上升風險：<b>{seaRisk === 1 ? "有風險" : seaRisk === 0 ? "無風險" : "—"}</b>
              <span className="ml-2 text-xs text-gray-500">{seaLevelStr}</span>
            </span>
          </li>
        </ul>
      </div>

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
          href="https://tccip.ncdr.nat.gov.tw/km_column_one.aspx?kid=20220120175356"
          target="_blank"
          rel="noopener noreferrer"
        >
          深入占卜：氣候風險是全球未來十年最嚴重的頭號威脅
  

        </a>
      </p>
    </div>
  );
};
export default LivingTab;
