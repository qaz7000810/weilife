import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Gauge } from "lucide-react";
import { SecondaryButton } from "./ui/Buttons";

function QuizSection({ onNext, stepContent }) {
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
        console.error("Failed to load questions.", error);
        if (!isMounted) return;
        setQuestions([]);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setSelected(answers[currentIndex] ?? null);
  }, [answers, currentIndex]);

  const current = questions[currentIndex];
  const progressPercent = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;

  function handleSelect(optionKey) {
    setSelected(optionKey);
    const updatedAnswers = [...answers];
    updatedAnswers[currentIndex] = optionKey;
    setAnswers(updatedAnswers);

    window.setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
        return;
      }

      onNext(updatedAnswers);
    }, 220);
  }

  function handleQuestionBack() {
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => prev - 1);
  }

  if (loading) {
    return (
      <div className="surface-card">
        <div className="surface-card__body loading-card">
          <div className="spinner" />
          <p className="caption">正在載入題目。</p>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="surface-card">
        <div className="surface-card__body loading-card">
          <p className="caption">目前沒有可顯示的題目，請重新開始測驗。</p>
          <SecondaryButton type="button" onClick={() => onNext(answers)}>
            直接查看結果
          </SecondaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card quiz-shell quiz-shell--minimal">
      <div className="surface-card__body quiz-shell__body">
        <div className="quiz-stage">
          <div className="quiz-stage__meta">
            <p className="eyebrow">{stepContent?.label || "偏好測驗"}</p>
            <span className="hero-highlight">
              <Gauge size={16} />
              第 {currentIndex + 1} / {questions.length} 題
            </span>
          </div>

          <div className="progress-bar" aria-hidden="true">
            <div className="progress-bar__fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="feature-card quiz-question-card quiz-question-card--focused">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22 }}
              className="quiz-question-card__panel"
            >
              <div className="quiz-question-card__header quiz-question-card__header--compact">
                <p className="eyebrow">Question {String(currentIndex + 1).padStart(2, "0")}</p>
              </div>

              <h2 className="quiz-question-card__title quiz-question-card__title--focused">
                {current.question}
              </h2>

              <div className="quiz-choice-list quiz-choice-list--focused">
                {Object.entries(current.options).map(([key, text]) => {
                  const isSelected = selected === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelect(key)}
                      className={`quiz-choice ${isSelected ? "is-selected" : ""}`}
                      aria-pressed={isSelected}
                    >
                      <span className="quiz-choice__key">{key}</span>
                      <span className="quiz-choice__text">{text}</span>
                      <span className="quiz-choice__check" aria-hidden="true">
                        <Check size={16} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="quiz-actions quiz-actions--solo">
          <SecondaryButton type="button" onClick={handleQuestionBack} disabled={currentIndex === 0}>
            上一題
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

export default QuizSection;
