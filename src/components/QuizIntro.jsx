import { useEffect, useState } from "react";

function QuizIntro({ onStart }) {
  const [bgImage, setBgImage] = useState("");
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    const imagePath = `${import.meta.env.BASE_URL}assets/quiz-start.png`;
    setBgImage(imagePath);
  }, []);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center px-4"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* 用隱藏 <img> 觸發圖片 onLoad */}
      <img
        src={bgImage}
        alt="背景圖"
        onLoad={() => setIsImageLoaded(true)}
        className="hidden"
      />

      <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl text-center max-w-md w-full space-y-6">
        <h2 className="text-4xl sm:text-5xl font-bold font-huninn text-gray-800 leading-snug">
          氣候變遷占卜師——未Life
        </h2>
        <p className="text-xs text-gray-700 font-huninn leading-relaxed">
          帶你進入30年後氣候變遷的世界
        </p>

        {/* 只有當圖片載入完才顯示按鈕與作者資訊 */}
        {isImageLoaded && (
          <>
            <button
              onClick={onStart}
              className="h-[48px] inline-block font-bold text-[16px] bouder-[#ffffff] rounded-[36px] px-4 py-2 text-center text-[#ffffff] bg-[#4452edff] shadow-[0_4px_0_#5d9cd3ff] active:translate-y-[2px] active:shadow-none transition-all duration-150"
            >
              開始占卜
            </button>

            <p className="text-[10px] text-gray-600 font-huninn leading-relaxed mt-2">
              produced by NCDR氣候變遷組<br />
              台大大氣劉凱岳、中央地科葉珊杉、彰師地理謝侑辰、北市地生莊博文
            </p>
          </>
        )}
        <p className="text-xs text-[#8f8e8eff] font-huninn leading-relaxed space-y-6">produced by NCDR 氣候變遷組 暑期實習生</p>
        <p className="text-xs text-[#8f8e8eff] font-huninn leading-relaxed space-y-6">國立臺灣大學大氣科學系 劉凱岳</p>
        <p className="text-xs text-[#8f8e8eff] font-huninn leading-relaxed space-y-6"> 國立中央大學地球科學學系 葉珊杉</p>
        <p className="text-xs text-[#8f8e8eff] font-huninn leading-relaxed space-y-6">國立彰化師範大學地理學系 謝侑辰</p> 
        <p className="text-xs text-[#8f8e8eff] font-huninn leading-relaxed space-y-6">臺北市立大學地球環境暨生物資源學系 莊博文</p> 
      </div>
    </div>

  );
}

export default QuizIntro;