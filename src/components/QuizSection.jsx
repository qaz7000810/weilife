import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function QuizSection({ onNext }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/question_data.json`)
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center text-lg">載入中...</p>;

  const current = questions[currentIndex];

  function handleSelect(optionKey) {
    setSelected(optionKey);

    setTimeout(() => {
      const updatedAnswers = [...answers, optionKey];
      setAnswers(updatedAnswers);
      setSelected(null);

      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onNext(updatedAnswers);
      }
    }, 300);
  }
console.count("🌀 QuizSection Rendered")
  return (
    <div className="min-h-screen bg-[#E0E0E0] flex justify-center px-4 sm:px-8">
      <div className="min-h-screen flex items-center justify-center px-4 relative w-auto max-w-md mx-auto">
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-6 transition-all duration-400">
          <div className="relative min-h-[450px] sm:min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl sm:text-xl font-huninn text-[#004B97] mb-2">
                    第  {currentIndex + 1}  題
                  </h3>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#004B97] text-center leading-relaxed px-2">
                    {current.question}
                  </h2>
                </div>
                <div className="space-y-4">
                  {Object.entries(current.options).map(([key, text]) => (
                    <div key={key}>
                      <button
                        disabled={selected !== null}
                        onClick={() => handleSelect(key)}
                        className={`h-[40px] w-full rounded-[36px] border-2 px-4 py-2 text-center text-[20px] font-bold transition-all duration-300
                          ${
                            selected === key
                              ? "bg-[#003D79] text-white border-[#004B97] shadow-lg ring-2 ring-yellow-200"
                              : "bg-white text-[#004B97] border-[#004B97] hover:bg-[#fdf5ec]"
                          }
                          ${selected !== null && selected !== key ? "opacity-100" : ""}
                      `}
                      >
                        {text}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizSection;