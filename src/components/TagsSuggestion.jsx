import React, { useState, useEffect } from "react";
import LivingTab from './TagsTabs/LivingTab';
import TravelTab from './TagsTabs/TravelTab';
import TransportTab from './TagsTabs/TransportTab';


const TabsSuggestion = ({ userData, onNext }) => {
  const apiBase = import.meta.env.VITE_AI_PROXY_URL || "https://climate-ai-proxy.climate-quiz-yuchen.workers.dev";
  const [activeTab, setActiveTab] = useState("居住");
  const [adviceMap, setAdviceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [regionData, setRegionData] = useState(null);

  if (!userData || !userData.county || !userData.town) {
    return (
      <div className="text-center text-red-600 font-bold p-6">
        ⚠️ 錯誤：使用者資料尚未傳入，請重新開始測驗。
      </div>
    );
  }

  const fullRegionKey = `${userData.county}_${userData.town}`;
  const fullRegionDisplay = fullRegionKey.replace(/_/g, " ");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/region_scores.json`);
        const json = await res.json();
        setRegionData(json);
      } catch (err) {
        console.error("載入 region_scores.json 錯誤：", err);
      }
    };
    fetchData();
  }, []);

  const fallback = {
    score: 50,
    description: "資料載入中或無對應資料。",
    disaster: "未知",
    recommend: "未知",
  };

  const tabContent = {
    居住: {
      ...fallback,
      score: regionData?.[fullRegionKey]?.["居住"] ?? fallback.score,
      description: regionData?.[fullRegionKey]?.["description"] ?? fallback.description,
      disaster: regionData?.[fullRegionKey]?.["disaster"] ?? fallback.disaster,
      recommend: regionData?.[fullRegionKey]?.["recommend"] ?? fallback.recommend,
    },
    旅遊: {
      ...fallback,
      score: regionData?.[fullRegionKey]?.["旅遊"] ?? fallback.score,
      description: regionData?.[fullRegionKey]?.["description"] ?? fallback.description,
      disaster: regionData?.[fullRegionKey]?.["disaster"] ?? fallback.disaster,
      recommend: regionData?.[fullRegionKey]?.["recommend"] ?? fallback.recommend,
    },
    交通: {
      ...fallback,
      score: regionData?.[fullRegionKey]?.["交通"] ?? fallback.score,
      description: regionData?.[fullRegionKey]?.["description"] ?? fallback.description,
      disaster: regionData?.[fullRegionKey]?.["disaster"] ?? fallback.disaster,
      recommend: regionData?.[fullRegionKey]?.["recommend"] ?? fallback.recommend,
    },
  };

  const generateAdvice = async (tab) => {
    setLoading(true);
    const payload = {
      tab,
      region: fullRegionKey,
      score: tabContent[tab].score,
      disaster: tabContent[tab].disaster,
      recommend: tabContent[tab].recommend,
    };

    try {
      const res = await fetch(`${apiBase}/api/generate-advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const reply = data?.result || "目前無法取得建議。";
      setAdviceMap((prev) => ({ ...prev, [tab]: reply }));
    } catch (error) {
      console.error("fetch error", error);
      setAdviceMap((prev) => ({ ...prev, [tab]: "⚠️ 發生錯誤，請稍後再試。" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adviceMap[activeTab]) {
      generateAdvice(activeTab);
    }
    // eslint-disable-next-line
  }, [activeTab]);

  // tab 對應元件
  const tabComponents = {
    居住: LivingTab,
    旅遊: TravelTab,
    交通: TransportTab,
  };

  const CurrentTab = tabComponents[activeTab];

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col items-center justify-center px-4 py-8">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl text-center w-full max-w-4xl p-8 space-y-6">
        <div className="flex flex-col gap-6">
          <div className="w-full flex items-stretch justify-between gap-2 p-2 rounded-xl">
            {[
              { label: "居住", icon: "🏠" },
              { label: "旅遊", icon: "🏝️" },
              { label: "交通", icon: "🚌" }
            ].map(({ label, icon }) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={`flex-1 flex flex-col justify-center items-center text-sm font-bold py-3 rounded-lg transition-all duration-200 ${
                  activeTab === label
                    ? "bg-[#5d9cd3ff] text-[#ffffff] shadow-md"
                    : "text-[#70472d] hover:bg-[#e9d9cc]"
                }`}
              >
                <span className="text-2xl">{icon}</span>
                <span className="mt-1">{label}</span>
              </button>
            ))}
          </div>

          <CurrentTab
            data={tabContent[activeTab]}
            regionDisplay={fullRegionDisplay}
            advice={adviceMap[activeTab]}
            loading={loading}
            userData={userData}
          />
        </div>

        <div className="pt-4 text-right">
          <button
            className="w-[300px] h-[48px] font-bold text-[16px] rounded-[36px] px-4 py-2 text-center text-[#ffffff] bg-[#4452edff] shadow-[0_4px_0_#5d9cd3ff] active:translate-y-[2px] active:shadow-none transition-all duration-150"
            onClick={onNext}
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabsSuggestion;
