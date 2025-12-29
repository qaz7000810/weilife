// RadarChartResult.jsx
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import html2canvas from "html2canvas";
import { useState, useEffect } from "react";

function RadarChartResult({ scores, mascot, regionSummary, userData }) {
  console.log("🐾 RadarChartResult loaded", { scores, mascot, regionSummary, userData });

  const [regionScore, setRegionScore] = useState(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [totalScores, setTotalScores] = useState(null);
  const [isLoadingRegionScore, setIsLoadingRegionScore] = useState(false);
  const [regionScoreError, setRegionScoreError] = useState(null);

  // 雷達圖數據 - 添加調試信息
  const data = [
    { category: "幸福度", value: scores?.happiness || 0 },
    { category: "調適度", value: scores?.adaptability || 0 },
    { category: "便利度", value: scores?.convenience || 0 },
    { category: "樂活度", value: scores?.live || 0 },
    { category: "舒適度", value: scores?.comfortable || 0 },
  ];

  console.log("雷達圖數據:", data);

  // 載入地區總分數據
  useEffect(() => {
    const fetchRegionScore = async () => {
      // 檢查必要的用戶資料
      if (!userData?.county || !userData?.town) {
        console.warn("缺少用戶地區資料", userData);
        setRegionScoreError("缺少地區資料");
        return;
      }

      setIsLoadingRegionScore(true);
      setRegionScoreError(null);

      try {
        // 載入 totalscores.json
        const response = await fetch(`${import.meta.env.BASE_URL || '/'}data/totalscores.json`);
        
        if (!response.ok) {
          throw new Error(`載入檔案失敗: ${response.status} ${response.statusText}`);
        }

        const scoresData = await response.json();
        setTotalScores(scoresData);

        // 建構地區鍵值，格式為 "縣市_鄉鎮區"
        const regionKey = `${userData.county}_${userData.town}`;
        console.log("🔍 尋找地區鍵值:", regionKey);

        // 檢查該地區是否存在於數據中
        if (scoresData[regionKey]) {
          const score = scoresData[regionKey].綜合;
          setRegionScore(score);
          console.log("✅ 找到地區分數:", score);
        } else {
          console.warn("❌ 找不到該地區分數:", regionKey);
          console.log("📍 可用的地區鍵值範例:", Object.keys(scoresData).slice(0, 10));
          
          // 嘗試模糊匹配（可選）
          const similarKeys = Object.keys(scoresData).filter(key => 
            key.includes(userData.county) || key.includes(userData.town)
          );
          
          if (similarKeys.length > 0) {
            console.log("🔍 相似的地區鍵值:", similarKeys);
          }
          
          setRegionScoreError(`找不到 ${userData.county} ${userData.town} 的評分資料`);
        }
      } catch (error) {
        console.error("❌ 載入地區分數失敗:", error);
        setRegionScoreError(`載入失敗: ${error.message}`);
      } finally {
        setIsLoadingRegionScore(false);
      }
    };

    fetchRegionScore();
  }, [userData?.county, userData?.town]);

  // 生成圖片（不自動下載）
  const generateImage = async () => {
    if (isGeneratingImage) return;

    try {
      setIsGeneratingImage(true);
      
      const captureElement = document.getElementById("capture-target");
      if (!captureElement) {
        throw new Error("找不到要截圖的元素");
      }

      // 使用 html2canvas 生成圖片
      const canvas = await html2canvas(captureElement, {
        useCORS: true,
        backgroundColor: "#E0E0E0",
        scale: 2, // 提高解析度
        width: captureElement.scrollWidth,
        height: captureElement.scrollHeight,
        logging: false, // 關閉日誌以避免控制台雜訊
      });

      // 轉換為圖片 URL
      const dataUrl = canvas.toDataURL("image/png", 0.9);
      setGeneratedImageUrl(dataUrl);

    } catch (error) {
      console.error("生成圖片失敗:", error);
      alert("生成圖片失敗，請重試");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 取得地區評分的顯示組件
  const renderRegionScore = () => {
    if (isLoadingRegionScore) {
      return (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            <p className="text-gray-600">載入地區評分中...</p>
          </div>
        </div>
      );
    }

    if (regionScoreError) {
      return (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 mb-6 text-center">
          <p className="text-red-600 mb-1">⚠️ {regionScoreError}</p>
          <p className="text-sm text-red-500">請檢查地區選擇是否正確</p>
        </div>
      );
    }

    if (regionScore !== null) {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 text-center">
          <p className="text-gray-700 mb-1">你所在地區的氣候綜合評分為{regionScore}分</p>
        </div>
      );
    }

    return null;
  };

  // 如果沒有分數數據，顯示載入中
  if (!scores) {
    return (
      <div style={{ backgroundColor: '#E0E0E0' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#83482cff] mx-auto mb-4"></div>
          <p className="text-lg text-[#666666]">正在取得你的氣候洞察與指引...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#E0E0E0' }} className="min-h-screen px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-[#333333]">
          你的氣候調適性分析
        </h1>
        {/* 可截圖的內容區域 */}
        <div id="capture-target" style={{ backgroundColor: '#E0E0E0' }} className="rounded-2xl p-8 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-[#333333] mb-2">
              {userData?.name ? `${userData.name} 的氣候占卜結果` : "個人分析結果"}
            </h2>
          </div>
          {/* 1. 雷達圖區域 - 首先顯示 */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-full max-w-sm h-[350px]" style={{userSelect: 'none', pointerEvents: 'none'}}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={120} data={data}>
                  <PolarGrid gridType="polygon" />
                  <PolarAngleAxis 
                    dataKey="category" 
                    tick={{ fontSize: 14, fill: '#374151', fontWeight: 'bold' }}
                  />
                  <Radar 
                    name="調適性分數" 
                    dataKey="value" 
                    stroke="#f398f7ff" 
                    fill="#f1bbf8ff" 
                    fillOpacity={0.25}
                    strokeWidth={3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. 角色圖片區域 - 第二個顯示 */}
          <div className="flex flex-col items-center mb-8">
            {mascot?.image && (
              <div className="mb-6">
                <img
                  src={mascot.image}
                  alt={mascot.name || "你的氣候角色"}
                  className="w-48 h-auto rounded-xl mx-auto"
                  style={{userSelect: 'none', pointerEvents: 'none'}}
                  onError={(e) => {
                    console.error("角色圖片載入失敗:", e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-3 text-[#333333] text-center">
                {mascot?.name || "你的氣候夥伴"}
              </h3>
            </div>
          </div>

          {/* 3. 居住地資訊 - 第三個顯示 */}
          <div className="text-center mb-6">
            {userData?.county && userData?.town && (
              <p className="text-[#666666] text-lg">
                📍 居住地：{userData.county} {userData.town}
              </p>
            )}
          </div>

          {/* 4. 地區綜合評分 - 第四個顯示 */}
          {renderRegionScore()}

          {/* 5. 建議區域 - 最後顯示 */}
          <div style={{ backgroundColor: '#E0E0E0' }} className="rounded-xl p-6 w-full">
            <h3 className="text-xl font-bold mb-3 text-[#333333] text-center">
              氣候調適建議
            </h3>
            <p className="text-[#555555] leading-relaxed text-center">
              {regionSummary || "正在分析你的氣候調適性特質..."}
            </p>
          </div>
        </div>
        
        {/* 操作按鈕 */}
        <div className="text-center space-y-4">
          <button
            onClick={generateImage}
            disabled={isGeneratingImage}
            className={`w-[300px] h-[48px] font-bold text-[16px] rounded-[36px] px-4 py-2 text-center text-[#ffffff] bg-[#4452edff] shadow-[0_4px_0_#5d9cd3ff] active:translate-y-[2px] active:shadow-none transition-all duration-150 ${
              isGeneratingImage
                ? "opacity-50 cursor-not-allowed"
                : "hover:from-[#3a48d4] hover:to-[#7bc8f0]"
            }`}
          >
            {isGeneratingImage ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#ffffff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                生成中...
              </span>
            ) : (
              "生成分享圖片"
            )}
          </button>
        </div>

        {/* 生成的圖片預覽（用於長按保存） */}
        {generatedImageUrl && (
          <div className="mt-8 text-center">
            <h3 className="text-lg font-bold mb-4 text-[#333333]">生成的圖片</h3>
            <p className="text-sm text-[#666666] mb-4">
              💡 在手機上長按下方圖片可保存到相簿
            </p>
            <div className="inline-block rounded-2xl overflow-hidden">
              <img 
                src={generatedImageUrl} 
                alt="氣候調適性分析結果"
                className="max-w-full h-auto"
                style={{ maxWidth: '400px' }}
              />
            </div>
          </div>
        )}
      {/* 外部資源導引區塊 */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-center text-[#333333] mb-6">
            想了解更多氣候變遷知識嗎？
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            
            {/* TCCIP 官網 */}
            <a
              href="https://tccip.ncdr.nat.gov.tw/index.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl overflow-hidden shadow-lg bg-white hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="p-4 text-center">
                <p className="text-[#333333] font-bold">TCCIP 官方網站</p>
                <p className="text-sm text-[#666666] mt-1">全台氣候資料與分析平台</p>
              </div>
            </a>

            {/* Facebook 粉專 */}
            <a
              href="https://www.facebook.com/TaiwanClimateChange"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl overflow-hidden shadow-lg bg-white hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="p-4 text-center">
                <p className="text-[#333333] font-bold">TCCIP 臉書粉專</p>
                <p className="text-sm text-[#666666] mt-1">追蹤氣候資訊不漏接</p>
              </div>
            </a>

            {/* YouTube 頻道 */}
            <a
              href="https://www.youtube.com/@TCCIPOFFICE"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl overflow-hidden shadow-lg bg-white hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="p-4 text-center">
                <p className="text-[#333333] font-bold">TCCIP YouTube 頻道</p>
                <p className="text-sm text-[#666666] mt-1">觀看氣候主題影片</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RadarChartResult;