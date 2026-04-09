import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Gauge, Sparkles } from "lucide-react";
import { SecondaryButton } from "./ui/Buttons";
import SectionHeader from "./ui/SectionHeader";

function QuizSection({ onNext, stepContent }) {
  const MotionPanel = motion.div;
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let isMounted = true;

    fetch(`${import.meta.env.BASE_URL}data/question_data.json`)
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted) return;
        setQuestions(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("讀取題目資料失敗", error);
        if (!isMounted) return;
        setQuestions([]);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="surface-card">
        <div className="surface-card__body loading-card">
          <div className="spinner" />
          <p className="caption">正在整理問答題目，稍後就能進入你的未來生活選擇。</p>
        </div>
      </div>
    );
  }

  const current = questions[currentIndex];
  if (!current) {
    return (
      <div className="surface-card">
        <div className="surface-card__body loading-card">
          <p className="caption">目前沒有可顯示的題目，請重新整理頁面再試一次。</p>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  function handleSelect(optionKey) {
    if (selected !== null) return;
    setSelected(optionKey);

    window.setTimeout(() => {
      const updatedAnswers = [...answers];
      updatedAnswers[currentIndex] = optionKey;
      setAnswers(updatedAnswers);
      setSelected(null);

      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onNext(updatedAnswers);
      }
    }, 220);
  }

  function handleQuestionBack() {
    if (selected !== null || currentIndex === 0) return;
    setAnswers((prev) => prev.slice(0, -1));
    setCurrentIndex((prev) => prev - 1);
  }

  return (
    <div className="surface-card quiz-shell">
      <div className="surface-card__body quiz-shell__body">
        <div className="quiz-shell__intro">
          <SectionHeader
            eyebrow={stepContent?.label}
            title="依直覺完成 8 題問答"
            description="選擇最接近你的答案。"
          />

          <aside className="info-panel quiz-side-panel">
            <div className="quiz-side-panel__header">
              <span className="hero-highlight">
                <ClipboardList size={16} />
                第 {currentIndex + 1} / {questions.length} 題
              </span>
              <span className="hero-highlight">
                <Gauge size={16} />
                進度 {Math.round(progressPercent)}%
              </span>
            </div>

            <div className="progress-bar" aria-hidden="true">
              <div className="progress-bar__fill" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="quiz-side-point">
              <p className="quiz-side-point__label">作答提醒</p>
              <p>不需要思考標準答案，選最接近你的選項即可。</p>
            </div>

            <div className="quiz-side-point">
              <p className="quiz-side-point__label">完成後</p>
              <p>系統會產生你的個人化氣候生活報告。</p>
            </div>
          </aside>
        </div>

        <div className="feature-card quiz-question-card">
          <AnimatePresence mode="wait">
            <MotionPanel
              key={currentIndex}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.28 }}
              className="quiz-question-card__panel"
            >
              <div className="quiz-question-card__header">
                <p className="eyebrow">Question {String(currentIndex + 1).padStart(2, "0")}</p>
                <span className="hero-highlight">
                  <Sparkles size={16} />
                  依直覺作答
                </span>
              </div>

              <h2 className="quiz-question-card__title">{current.question}</h2>

              <div className="quiz-choice-list">
                {Object.entries(current.options).map(([key, text]) => (
                  <button
                    key={key}
                    type="button"
                    disabled={selected !== null}
                    onClick={() => handleSelect(key)}
                    className={`quiz-choice ${selected === key ? "is-selected" : ""}`}
                  >
                    <span className="quiz-choice__key">{key}</span>
                    <span className="quiz-choice__text">{text}</span>
                  </button>
                ))}
              </div>
            </MotionPanel>
          </AnimatePresence>
        </div>

        <div className="quiz-actions">
          <SecondaryButton type="button" onClick={handleQuestionBack} disabled={currentIndex === 0 || selected !== null}>
            回到上一題
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

export default QuizSection;
