import {
  ArrowLeft,
  ChartColumn,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Sparkles,
  UserRound,
} from "lucide-react";

const iconMap = {
  PROFILE: UserRound,
  SCENARIO: Sparkles,
  QUIZ: ClipboardList,
  RESULT: ChartColumn,
};

function StepProgress({
  currentStep,
  progressSteps,
  progressValue,
  stepMeta,
  onBack,
  canGoBack,
}) {
  const currentMeta = stepMeta[currentStep];

  return (
    <div className="progress-card">
      <div className="progress-card__top">
        <div>
          <p className="progress-card__label">流程</p>
          <p className="progress-card__value">{currentMeta?.label}</p>
        </div>

        <div className="progress-card__actions">
          <span className="progress-card__percent">{Math.round(progressValue)}%</span>
          {canGoBack ? (
            <button type="button" onClick={onBack} className="icon-button">
              <ArrowLeft size={16} />
              返回上一步
            </button>
          ) : null}
        </div>
      </div>

      <div className="progress-bar" aria-hidden="true">
        <div className="progress-bar__fill" style={{ width: `${progressValue}%` }} />
      </div>

      <div className="progress-steps">
        {progressSteps.map((step, index) => {
          const meta = stepMeta[step];
          const Icon = iconMap[step] || CircleDot;
          const currentIndex = progressSteps.indexOf(currentStep);
          const isCurrent = step === currentStep;
          const isCompleted = index < currentIndex;

          return (
            <div
              key={step}
              className={`progress-step ${isCurrent ? "is-current" : ""} ${isCompleted ? "is-completed" : ""}`}
            >
              <span className="progress-step__icon">
                {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </span>
              <span>{meta?.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StepProgress;
