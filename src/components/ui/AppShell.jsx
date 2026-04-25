import { motion } from "framer-motion";
import { APP_SUBTITLE, APP_TITLE } from "../../lib/appFlow";
import StepProgress from "./StepProgress";

function AppShell({
  children,
  currentStep,
  progressSteps,
  progressValue,
  onBack,
  canGoBack,
  stepMeta,
  showHeader = true,
  showProgress = true,
}) {
  const MotionHeader = motion.header;
  const MotionMain = motion.main;
  const isIntro = !showHeader;
  const stepClassName = currentStep ? `app-shell--step-${String(currentStep).toLowerCase()}` : "";

  return (
    <div className={`app-shell ${isIntro ? "app-shell--intro" : ""} ${stepClassName}`.trim()}>
      <div className="app-shell__backdrop" aria-hidden="true">
        <div className="app-shell__wash app-shell__wash--coral" />
        <div className="app-shell__wash app-shell__wash--sky" />
        <div className="app-shell__wash app-shell__wash--sun" />
        <div className="app-shell__texture" />
      </div>

      <div className={`app-shell__inner ${isIntro ? "app-shell__inner--intro" : ""}`}>
        {showHeader ? (
          <MotionHeader
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="app-shell__header"
          >
            <div className="surface-card surface-card--shell app-shell__masthead">
              <div className="surface-card__body app-shell__masthead-body">
                <div className="app-shell__brand-column">
                  <p className="eyebrow">Climate Life Report</p>
                  <div className="app-shell__brand-row">
                    <div>
                      <h1 className="app-brand">{APP_TITLE}</h1>
                      <p className="app-brand__subtitle">{APP_SUBTITLE}</p>
                    </div>
                  </div>
                </div>

                {showProgress ? (
                  <StepProgress
                    currentStep={currentStep}
                    progressSteps={progressSteps}
                    progressValue={progressValue}
                    stepMeta={stepMeta}
                    onBack={onBack}
                    canGoBack={canGoBack}
                  />
                ) : null}
              </div>
            </div>
          </MotionHeader>
        ) : null}

        <MotionMain
          key={currentStep}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`app-shell__content ${isIntro ? "app-shell__content--intro" : ""}`}
        >
          {children}
        </MotionMain>
      </div>
    </div>
  );
}

export default AppShell;
