import { useEffect, useState } from "react";
import { CalendarDays, MapPinned, UserRound } from "lucide-react";
import { PrimaryButton } from "./ui/Buttons";
import SectionHeader from "./ui/SectionHeader";

const initialState = {
  name: "",
  age: "",
  county: "",
  town: "",
};

export default function UserInputForm({ onSave, userData = {} }) {
  const [formData, setFormData] = useState({ ...initialState, ...userData });
  const [townMap, setTownMap] = useState({});
  const [loading, setLoading] = useState(true);

  const counties = Object.keys(townMap);

  useEffect(() => {
    let isMounted = true;

    fetch(`${import.meta.env.BASE_URL}data/town_data.json`)
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted) return;
        setTownMap(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("讀取鄉鎮資料失敗", error);
        if (!isMounted) return;
        setTownMap({});
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "age" && !/^\d*$/.test(value)) return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "county" ? { town: "" } : {}),
    }));
  };

  const isValid = () => {
    const age = Number(formData.age);
    return (
      formData.name.trim() !== "" &&
      formData.county !== "" &&
      formData.town !== "" &&
      Number.isFinite(age) &&
      age > 3 &&
      age < 100
    );
  };

  if (loading) {
    return (
      <div className="surface-card">
        <div className="surface-card__body loading-card">
          <div className="spinner" />
          <p className="caption">正在整理地區資料，讓你的情境能對應到正確的地方氣候訊號。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card profile-form-panel profile-form-panel--mobile profile-form-panel--cover">
      <div className="surface-card__body profile-form-panel__body">
        <SectionHeader
          eyebrow="資料輸入"
          title="填寫基本資料"
          description=""
        />

        <div className="form-fields form-fields--mobile">
          <div className="field field--boxed">
            <label htmlFor="name">
              <UserRound size={16} />
              你的名字
            </label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              autoComplete="name"
              placeholder="例如：小安"
            />
          </div>

          <div className="field field--boxed">
            <label htmlFor="age">
              <CalendarDays size={16} />
              目前年齡
            </label>
            <input
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="input"
              autoComplete="bday"
              inputMode="numeric"
              min="3"
              max="99"
              placeholder="例如：26"
            />
          </div>

          <div className="field field--boxed field--location">
            <label htmlFor="county">
              <MapPinned size={16} />
              所在縣市
            </label>
            <select
              id="county"
              name="county"
              value={formData.county}
              onChange={handleChange}
              className="select"
              autoComplete="address-level1"
            >
              <option value="">請選擇縣市</option>
              {counties.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </div>

          {formData.county ? (
            <div className="field field--boxed field--location">
              <label htmlFor="town">
                <MapPinned size={16} />
                所在鄉鎮
              </label>
              <select
                id="town"
                name="town"
                value={formData.town}
                onChange={handleChange}
                className="select"
                autoComplete="address-level2"
              >
                <option value="">請選擇鄉鎮</option>
                {(townMap[formData.county] || []).map((town) => (
                  <option key={town} value={town}>
                    {town}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="profile-form-actions">
          <PrimaryButton
            type="button"
            onClick={() => onSave?.(formData)}
            disabled={!isValid()}
            size="lg"
          >
            探索你的氣候占卜
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
