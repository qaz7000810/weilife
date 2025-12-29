import { useEffect, useState } from "react";

export default function UserInputForm({ onNext, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    county: "",
    town: ""
  });

  const [townMap, setTownMap] = useState({});
  const [loading, setLoading] = useState(true);

  const counties = Object.keys(townMap);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/town_data.json`)
      .then((res) => res.json())
      .then((data) => {
        setTownMap(data);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "age") {
      // 僅允許正整數
      if (!/^\d*$/.test(value)) return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "county" ? { town: "" } : {})
    }));
  };

  const isValid = () => {
    const age = Number(formData.age);
    return (
      formData.name.trim() !== "" &&
      formData.county !== "" &&
      formData.town !== "" &&
      !isNaN(age) &&
      age > 3 && age < 100
    );
  };

  const handleSubmit = () => {
    if (isValid()) {
      onSave?.(formData);
      onNext?.();
    }
  };

  if (loading) return <p className="text-center">載入中...</p>;

  return (
    <div className="min-h-screen bg-[#fdf8f4] flex justify-center px-4">
      <div className="w-full max-w-md flex flex-col justify-center py-16">
        <div className="bg-white shadow-md rounded-2xl p-6 space-y-6">
          <h1 className="text-2xl font-bold text-center text-brown-800">填寫基本資料</h1>

          {/* 暱稱 */}
          <div className="flex flex-col items-center">
            <label htmlFor="name" className="text-xl font-bold text-brown-700 mb-1">
              匿稱
            </label>
            <input
              type="text"
              id="name"
              name="name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              className="text-center rounded-[36px] w-[300px] border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-brown-300 focus:outline-none"
            />
          </div>

          {/* 年齡 */}
          <div className="flex flex-col items-center">
            <label htmlFor="age" className="text-xl font-bold text-brown-700 mb-1">
              年齡
            </label>
            <input
              type="number"
              id="age"
              name="age"
              autoComplete="bday"
              value={formData.age}
              onChange={handleChange}
              step="1"
              min="3"
              max="99"
              className="text-center rounded-[36px] w-[300px] border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-brown-300 focus:outline-none"
            />
          </div>

          {/* 居住地 */}
          <div className="flex flex-col items-center">
            <label htmlFor="county" className="text-xl font-bold text-brown-700 mb-1">
              居住地
            </label>
            <select
              id="county"
              name="county"
              autoComplete="address-level1"
              value={formData.county}
              onChange={handleChange}
              className="rounded-[36px] w-[300px] border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-brown-300 focus:outline-none"
            >
              <option value="">請選擇</option>
              {counties.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 鄉鎮市區 */}
          {formData.county && (
            <div className="flex flex-col items-center">
              <label htmlFor="town" className="text-xl font-medium text-brown-700 mb-1">
                鄉鎮市區
              </label>
              <select
                id="town"
                name="town"
                autoComplete="address-level2"
                value={formData.town}
                onChange={handleChange}
                className="rounded-[36px] w-[300px] border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-brown-300 focus:outline-none"
              >
                <option value="">請選擇</option>
                {townMap[formData.county].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <p>

            </p>
          </div>
          {/* 送出按鈕 */}
          <div className="flex justify-center gap ">
            <button
              onClick={handleSubmit}
              disabled={!isValid()}
              className={`w-[300px] h-[48px] font-bold text-[16px] rounded-[36px] px-4 py-2 text-center text-[#ffffff] bg-[#4452edff] shadow-[0_4px_0_#5d9cd3ff] active:translate-y-[2px] active:shadow-none transition-all duration-150 ${
                isValid()
                  ? "bg-[#4452edff] hover:bg-[#4452edff]"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              探索你的氣候占卜
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}