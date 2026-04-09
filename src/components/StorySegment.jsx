import { useEffect, useState } from "react";
import { CalendarClock, MapPinned, ThermometerSun } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "./ui/Buttons";
import SectionHeader from "./ui/SectionHeader";
import {
  buildFallbackStory,
  buildRegionKey,
  buildScenarioHighlights,
  formatRegionName,
  getProjectedAge,
  getRegionSignals,
} from "../lib/climateEngine";

function StorySegment({ userData, onNext, stepContent }) {
  const apiBase =
    import.meta.env.VITE_AI_PROXY_URL ||
    "https://climate-ai-proxy.climate-quiz-yuchen.workers.dev";
  const projectedAge = getProjectedAge(userData.age);
  const regionKey = buildRegionKey(userData);
  const regionName = formatRegionName(regionKey);
  const signals = getRegionSignals(regionKey);
  const signalCards = buildScenarioHighlights(signals);

  const [story, setStory] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function generateStory() {
      setIsLoading(true);
      const fallbackStory = buildFallbackStory({
        projectedAge,
        regionName: formatRegionName(regionKey),
        signals: getRegionSignals(regionKey),
      });

      try {
        const response = await fetch(`${apiBase}/api/generate-story`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: userData.name,
            age: projectedAge,
            county: userData.county,
            town: userData.town,
          }),
        });

        if (!response.ok) {
          throw new Error(`Story API ${response.status}`);
        }

        const data = await response.json();
        if (!isMounted) return;
        const generatedStory = data.result?.trim();
        if (!generatedStory || generatedStory.length < 120) {
          setStory(fallbackStory);
          return;
        }
        setStory(generatedStory);
      } catch (error) {
        console.error("生成情境故事失敗", error);
        if (!isMounted) return;
        setStory(fallbackStory);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    generateStory();

    return () => {
      isMounted = false;
    };
  }, [apiBase, projectedAge, regionKey, userData.county, userData.name, userData.town]);

  return (
    <div className="surface-card story-page">
      <div className="surface-card__body story-page__body">
        <SectionHeader
          eyebrow={stepContent?.label}
          title={`先走進 2055 年的 ${regionName}`}
          description="先讀完你的未來情境，再開始作答。"
        />

        <div className="story-meta-strip">
          <span className="hero-highlight">
            <CalendarClock size={16} />
            時間設定 2055
          </span>
          <span className="hero-highlight">
            <MapPinned size={16} />
            {regionName}
          </span>
          <span className="hero-highlight">
            <ThermometerSun size={16} />
            {projectedAge ? `未來年齡 ${projectedAge} 歲` : "未來生活階段"}
          </span>
        </div>

        <div className="story-layout">
          <div className="feature-card story-storycard">
            {isLoading ? (
              <div className="loading-card story-loading">
                <div className="spinner" />
                <p className="caption">正在生成你的未來生活片段，讓後面的測驗更有代入感。</p>
              </div>
            ) : (
              <div className="story-storycard__content">
                <div className="story-copy">
                  {story
                    .split(/\n{2,}/)
                    .map((paragraph) => paragraph.trim())
                    .filter(Boolean)
                    .map((paragraph) => (
                      <p key={paragraph} className="story-copy__paragraph">
                        {paragraph}
                      </p>
                    ))}
                </div>
              </div>
            )}
          </div>

          <aside className="info-panel story-insight-panel">
            <div className="story-insight-panel__header">
              <p className="eyebrow">Local Signals</p>
              <h3>地區氣候重點</h3>
            </div>

            <div className="story-signal-grid">
              {signalCards.map((card) => (
                <article key={card.label} className="story-signal-card">
                  <p className="story-signal-card__label">{card.label}</p>
                  <h4>{card.value}</h4>
                  <p>{card.description}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>

        <div className="story-footer">
          <div className="story-actions">
            <PrimaryButton onClick={onNext}>開始回答測驗</PrimaryButton>
            <SecondaryButton type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              回到故事開頭
            </SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StorySegment;
