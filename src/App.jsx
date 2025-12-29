import { useReducer, useState } from "react";
import UserInputForm from "./components/UserInputForm";
import StorySegment from "./components/StorySegment";
import QuizIntro from "./components/QuizIntro";
import QuizSection from "./components/QuizSection";
import ResultPersonality from "./components/ResultPersonality";
import TagsSuggestion from "./components/TagsSuggestion";
import RadarChartResult from "./components/RadarChartResult";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export const steps = {
  QUIZ_INTRO: "QUIZ_INTRO",
  USER_INPUT: "USER_INPUT",
  STORY: "STORY",
  QUIZ_MAIN: "QUIZ_MAIN",
  RESULT: "RESULT",
  TAGS: "TAGS",
  RADAR: "RADAR",
};

const stepList = [
  steps.QUIZ_INTRO,
  steps.USER_INPUT,
  steps.STORY,
  steps.QUIZ_MAIN,
  steps.RESULT,
  steps.TAGS,
  steps.RADAR,
];

// 控制流程的 reducer
function stepReducer(state, action) {
  switch (action.type) {
    case "NEXT":
      return action.payload;
    default:
      return state;
  }
}

// 計算分數的函數
function calculateScores(answers) {
  // 這裡你可以根據實際的計分邏輯調整
  // 暫時使用簡單的隨機計分作為示例
  const scoreMap = {
    A: { happiness: 10, adaptability: 5, convenience: 20, live: 20, comfortable: 25 },
    B: { happiness: 15, adaptability: 10, convenience: 20, live: 15, comfortable: 15 },
    C: { happiness: 20, adaptability: 20, convenience: 15, live: 10, comfortable: 20 },
    D: { happiness: 30, adaptability: 30, convenience: 30, live: 25, comfortable: 30 }
  };

  const scores = {
    happiness: 0,
    adaptability: 0,
    convenience: 0,
    live: 0,
    comfortable: 0
  };

  answers.forEach(answer => {
    const answerScores = scoreMap[answer] || scoreMap.A;
    Object.keys(scores).forEach(key => {
      scores[key] += answerScores[key];
    });
  });

  // 將分數轉換為百分比（假設每個領域最高分為200）
  Object.keys(scores).forEach(key => {
    scores[key] = Math.min(Math.round((scores[key] / 200) * 100), 100);
  });

  return scores;
}

// 根據人格選擇吉祥物
function selectMascot(personalityType) {
  const mascot = {
    T1: { image: `${import.meta.env.BASE_URL}mascot/T1.png`, name: "滴答獺獺" },
    T2: { image: `${import.meta.env.BASE_URL}mascot/T2.png`, name: "冰原企企" },
    T3: { image: `${import.meta.env.BASE_URL}mascot/T3.png`, name: "沙灘龜龜" },
    T4: { image: `${import.meta.env.BASE_URL}mascot/T4.png`, name: "遷移浣熊" },
  };
  return mascot[personalityType] || mascot.T1;
}

// 生成地區總結 - 這是缺少的函數！
function generateRegionSummary(userData, scores) {
  if (!userData || !scores) {
    return "正在分析你的氣候適應性特質...";
  }

  const { county, town, name } = userData;
  const locationText = county && town ? `在${county}${town}` : "";
  const nameText = name || "你";

  // 找出最高的分數類別
  const scoreEntries = Object.entries(scores);
  const highestScore = scoreEntries.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );
  
  const categoryNames = {
    happiness: "幸福度",
    adaptability: "調適度", 
    convenience: "便利度",
    live: "樂活度",
    comfortable: "舒適度"
  };

  const strengthCategory = categoryNames[highestScore[0]] || "適應度";
  
  // 根據最高分數生成個性化總結
  const summaries = {
    happiness: `${nameText}是個樂觀開朗的人！${locationText}的氣候環境讓你感到愉悅，你能夠在各種天氣條件下保持正面的心態，並且善於從氣候變化中找到生活的樂趣。`,
    adaptability: `${nameText}具有超強的調適能力！無論${locationText}的氣候如何變化，你都能快速調整自己的生活方式，靈活應對各種氣象挑戰。`,
    convenience: `${nameText}重視生活的便利性！你善於利用${locationText}的氣候特色，合理安排日常活動，讓生活更加高效舒適。`,
    live: `${nameText}是個熱愛生活的人！你懂得享受${locationText}的氣候之美，無論是陽光明媚還是細雨綿綿，都能找到屬於自己的生活節奏。`,
    comfortable: `${nameText}追求舒適的生活品質！你對${locationText}的氣候環境有敏銳的感知，能夠創造出最適合自己的舒適生活空間。`
  };

  return summaries[highestScore[0]] || `${nameText}在${locationText}展現出優秀的氣候適應特質，能夠與當地的氣候環境和諧共處。`;
}

// 生成地區總結
function App() {
  const [step, dispatch] = useReducer(stepReducer, steps.QUIZ_INTRO);
  const [userData, setUserData] = useState({});

  const currentStepIndex = stepList.indexOf(step);
  const totalSteps = stepList.length;
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;
  
  return (
    <div className="min-h-screen font-huninn bg-[#E0E0E0] mx-auto">

      {/* 各步驟畫面 */}
      {step === steps.QUIZ_INTRO && (
        <QuizIntro
          onStart={() => dispatch({ type: "NEXT", payload: steps.USER_INPUT })}
        />
      )}

      {step === steps.USER_INPUT && (
        <UserInputForm
          onSave={async (data) => {
            try {
              await addDoc(collection(db, "users"), data);
              setUserData(data);
              dispatch({ type: "NEXT", payload: steps.STORY });
            } catch (err) {
              alert("資料儲存失敗，請再試一次！");
              console.error("❌", err);
            }
          }}
          onNext={() => dispatch({ type: "NEXT", payload: steps.STORY })}
        />
      )}

      {step === steps.STORY && (
        <StorySegment
          userData={userData}
          onNext={() => dispatch({ type: "NEXT", payload: steps.QUIZ_MAIN })}
        />
      )}

      {step === steps.QUIZ_MAIN && (
        <QuizSection
          onNext={(answers) => {
            const updatedData = { ...userData, answers };
            setUserData(updatedData);
            dispatch({ type: "NEXT", payload: steps.RESULT });
          }}
        />
      )}

      {step === steps.RESULT && (
        <ResultPersonality
          userData={userData}
          onNext={() => dispatch({ type: "NEXT", payload: steps.TAGS })}
        />
      )}

      {step === steps.TAGS && (
        <TagsSuggestion
          userData={userData}
          onNext={() => {
            // 在進入雷達圖之前計算所有必要的數據
            const scores = calculateScores(userData.answers);
            
            // 根據答案確定人格類型
            const count = { A: 0, B: 0, C: 0, D: 0 };
            userData.answers.forEach((ans) => {
              if (count[ans]) {
                count[ans]++;
              } else {
                count[ans] = 1;
              }
            });
            
            const maxOption = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
            const personalityMap = {
              A: "T1",
              B: "T2", 
              C: "T3",
              D: "T4",
            };
            
            const personalityType = personalityMap[maxOption] || "T1";
            const mascot = selectMascot(personalityType);
            const regionSummary = generateRegionSummary(userData, scores);
            
            const finalData = {
              ...userData,
              scores,
              mascot,
              regionSummary,
              personalityType
            };
            
            setUserData(finalData);
            dispatch({ type: "NEXT", payload: steps.RADAR });
          }}
        />
      )}

      {step === steps.RADAR && userData?.scores && (
        <RadarChartResult
          scores={userData.scores}
          mascot={userData.mascot}
          regionSummary={userData.regionSummary}
          userData={userData} // 🔥 這是關鍵修復！加入 userData 參數
        />
      )}
    </div>
  );
}

export default App;