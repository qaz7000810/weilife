import { useReducer, useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import QuizIntro from "./components/QuizIntro";
import QuizSection from "./components/QuizSection";
import ResultDashboard from "./components/ResultDashboard";
import StorySegment from "./components/StorySegment";
import UserInputForm from "./components/UserInputForm";
import AppShell from "./components/ui/AppShell";
import { db } from "./firebase";
import { getProgressValue, getStepIndex, progressSteps, stepMeta, stepOrder, steps } from "./lib/appFlow";

function stepReducer(state, action) {
  switch (action.type) {
    case "GO_TO":
      return action.payload;
    default:
      return state;
  }
}

function App() {
  const [step, dispatch] = useReducer(stepReducer, steps.INTRO);
  const [userData, setUserData] = useState({});

  const currentStepIndex = getStepIndex(step);
  const canGoBack = currentStepIndex > 0;
  const progressValue = getProgressValue(step);

  const handleGoTo = (nextStep) => {
    dispatch({ type: "GO_TO", payload: nextStep });
  };

  const handleBack = () => {
    if (!canGoBack) return;
    const previousStep = stepOrder[currentStepIndex - 1];
    handleGoTo(previousStep);
  };

  const handleProfileSave = async (profile) => {
    try {
      await addDoc(collection(db, "users"), profile);
    } catch (error) {
      console.error("儲存使用者資料失敗，將繼續在本地流程中使用。", error);
    }

    setUserData((prev) => ({ ...prev, ...profile }));
    handleGoTo(steps.SCENARIO);
  };

  return (
    <AppShell
      currentStep={step}
      progressSteps={progressSteps}
      progressValue={progressValue}
      onBack={handleBack}
      canGoBack={canGoBack}
      stepMeta={stepMeta}
      showHeader={step !== steps.INTRO}
      showProgress={step !== steps.INTRO}
    >
      {step === steps.INTRO ? <QuizIntro onStart={() => handleGoTo(steps.PROFILE)} /> : null}

      {step === steps.PROFILE ? (
        <UserInputForm
          userData={userData}
          stepContent={stepMeta[step]}
          onSave={handleProfileSave}
        />
      ) : null}

      {step === steps.SCENARIO ? (
        <StorySegment
          userData={userData}
          stepContent={stepMeta[step]}
          onNext={() => handleGoTo(steps.QUIZ)}
        />
      ) : null}

      {step === steps.QUIZ ? (
        <QuizSection
          stepContent={stepMeta[step]}
          onNext={(answers) => {
            setUserData((prev) => ({ ...prev, answers }));
            handleGoTo(steps.RESULT);
          }}
        />
      ) : null}

      {step === steps.RESULT ? (
        <ResultDashboard
          userData={userData}
          stepContent={stepMeta[step]}
          onRestart={() => handleGoTo(steps.INTRO)}
        />
      ) : null}
    </AppShell>
  );
}

export default App;
