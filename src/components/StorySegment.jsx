import { useEffect, useState } from "react";

export default function StorySegment({ userData, onNext }) {
  const [story, setStory] = useState("");
  const [bgImage, setBgImage] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [storyLoaded, setStoryLoaded] = useState(false);

  useEffect(() => {
    const age = parseInt(userData.age, 10);
    if (isNaN(age)) return;
    const projectedAge = age + 30;

    const getAgeCategory = (age) => {
      if (age <= 40) return "youth";
      else if (age <= 65) return "adult";
      else return "elder";
    };

    const category = getAgeCategory(projectedAge);
    const base = import.meta.env.BASE_URL || "/";
    const imageUrl = `${base}mascot/${category}.jpg`;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setBgImage(imageUrl);
      setImageLoaded(true);
    };

    fetch("https://climate-ai-proxy.climate-quiz-yuchen.workers.dev/api/generate-story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  name: userData.name,
  age: projectedAge,
  county: userData.county,
  town: userData.town
}),
    })
      .then((res) => {
        if (!res.ok) throw new Error("API 回應非 200");
        return res.json();
      })
      .then((data) => {
        setStory(data.result);
        setStoryLoaded(true);
      })
      .catch((err) => {
        console.error("生成故事錯誤：", err);
        setStory("⚠️ 故事載入失敗，請稍後再試。");
        setStoryLoaded(true);
      });
  }, [userData]);

  const allLoaded = imageLoaded && storyLoaded;

  return (
    <div className="min-h-screen w-full bg-[#E0E0E0] flex justify-center relative overflow-hidden">
      {/* 背景圖層 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[414px] h-screen z-0">
        <img
          src={bgImage}
          alt="背景圖片"
          className=" w-full h-full object-cover
      object-center
      md:object-bottom"
        />
      </div>

      {/* 載入中遮罩：文字在上、松鼠在下 */}
      {!allLoaded && (
        <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
          <p className="text-white text-base font-semibold">
            正在建構你的未來世界⋯⋯
          </p>
          <img
            src={`${import.meta.env.BASE_URL || "/"}mascot/T6.png`}
            alt="loading mascot"
            className="w-20 h-20 animate-bounce"
          />
        </div>
      )}

      {/* 主內容顯示區塊 */}
      {allLoaded && (
        <div className="absolute inset-0 flex justify-center items-center z-10">
          <div className="w-full max-w-[414px] px-8 flex justify-center items-center">
            <div className="bg-white/90 backdrop-blur-sm text-gray-800 rounded-2xl p-6 text-center shadow-lg w-full max-w-[300px]">
              <h2 className="text-2xl font-bold mb-6">未來30年後的你⋯⋯</h2>
              <p className="text-3xl leading-relaxed whitespace-pre-line mb-8">{story}</p>
              {story && (
                <button
                  className="h-[48px] inline-block font-bold text-[16px] bouder-[#ffffff] rounded-[36px] px-4 py-2 text-center text-[#ffffff] bg-[#4452edff] shadow-[0_4px_0_#5d9cd3ff] active:translate-y-[2px] active:shadow-none transition-all duration-150"
                  onClick={onNext}
                >
                  我準備好了！
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}