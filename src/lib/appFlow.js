export const APP_TITLE = "未來氣候占卜師 未LIFE";
export const APP_SUBTITLE = "個人化氣候生活報告";

export const steps = {
  INTRO: "INTRO",
  PROFILE: "PROFILE",
  SCENARIO: "SCENARIO",
  QUIZ: "QUIZ",
  RESULT: "RESULT",
};

export const stepOrder = [
  steps.INTRO,
  steps.PROFILE,
  steps.SCENARIO,
  steps.QUIZ,
  steps.RESULT,
];

export const progressSteps = [
  steps.PROFILE,
  steps.SCENARIO,
  steps.QUIZ,
  steps.RESULT,
];

export const stepMeta = {
  [steps.INTRO]: {
    label: "首頁",
    title: APP_TITLE,
    description: "建立你的氣候生活報告。",
  },
  [steps.PROFILE]: {
    label: "資料設定",
    title: "建立個人資料",
    description: "輸入年齡與居住地。",
  },
  [steps.SCENARIO]: {
    label: "情境",
    title: "閱讀 2055 情境",
    description: "進入你的未來場景。",
  },
  [steps.QUIZ]: {
    label: "問答",
    title: "完成偏好問答",
    description: "依直覺作答。",
  },
  [steps.RESULT]: {
    label: "結果報告",
    title: "查看你的氣候生活報告",
    description: "查看結果與建議。",
  },
};

export function getStepIndex(step) {
  return stepOrder.indexOf(step);
}

export function getProgressIndex(step) {
  return progressSteps.indexOf(step);
}

export function getProgressValue(step) {
  const progressIndex = getProgressIndex(step);
  if (progressIndex === -1) return 0;
  return ((progressIndex + 1) / progressSteps.length) * 100;
}
