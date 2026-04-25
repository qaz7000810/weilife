import { useEffect, useMemo, useState } from "react";
import { MapPinned, ThermometerSun } from "lucide-react";
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

function sanitizeStoryText(value) {
  return (value || "")
    .replace(/20\d{2}年/g, "約 30 年後")
    .replace(/\r\n/g, "\n")
    .trim();
}

function splitStoryParagraphs(value) {
  const text = sanitizeStoryText(value);
  const explicitParagraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1) {
    return explicitParagraphs;
  }

  const sentences = text
    .split(/(?<=[。！？!?])\s*/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length <= 2) {
    return text ? [text] : [];
  }

  const paragraphs = [];
  let current = "";

  sentences.forEach((sentence) => {
    const next = current ? `${current}${sentence}` : sentence;
    if (next.length > 90 && current) {
      paragraphs.push(current);
      current = sentence;
      return;
    }
    current = next;
  });

  if (current) {
    paragraphs.push(current);
  }

  return paragraphs;
}

function StorySegment({ userData, onNext, stepContent, onStoryReady }) {
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
  const storyKey = `${userData.name || ""}|${projectedAge || ""}|${userData.county || ""}|${
    userData.town || ""
  }`;

  useEffect(() => {
    let isMounted = true;

    async function generateStory() {
      if (userData.scenarioStory && userData.scenarioStoryKey === storyKey) {
        setStory(userData.scenarioStory);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const fallbackStory = sanitizeStoryText(
        buildFallbackStory({
          projectedAge,
          regionName: formatRegionName(regionKey),
          signals: getRegionSignals(regionKey),
        })
      );

      const commitStory = (nextStory) => {
        const cleanStory = sanitizeStoryText(nextStory);
        setStory(cleanStory);
        onStoryReady?.({ story: cleanStory, key: storyKey });
      };

      const fallbackStoryPayload = buildFallbackStory({
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
        const generatedStory = sanitizeStoryText(data.result);
        if (!generatedStory || generatedStory.length < 120) {
          commitStory(fallbackStory || fallbackStoryPayload);
          return;
        }
        commitStory(generatedStory);
      } catch (error) {
        console.error("Failed to generate story.", error);
        if (!isMounted) return;
        commitStory(fallbackStory || fallbackStoryPayload);
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
  }, [
    apiBase,
    onStoryReady,
    projectedAge,
    regionKey,
    storyKey,
    userData.county,
    userData.name,
    userData.scenarioStory,
    userData.scenarioStoryKey,
    userData.town,
  ]);

  const paragraphs = useMemo(() => splitStoryParagraphs(story), [story]);

  return (
    <div className="surface-card story-page story-page--mobile story-page--cover">
      <div className="surface-card__body story-page__body">
        <SectionHeader
          eyebrow={stepContent?.label}
          title={`約 30 年後的 ${regionName}`}
          description="先看看這裡的生活情境，再開始回答後面的問題。"
        />

        <div className="story-meta-strip story-meta-strip--mobile">
          <span className="hero-highlight">
            <MapPinned size={16} />
            地點：{regionName}
          </span>
          <span className="hero-highlight">
            <ThermometerSun size={16} />
            {projectedAge ? `你的年齡：約 ${projectedAge} 歲` : "依你的資料推估生活情境"}
          </span>
        </div>

        <div className="story-layout story-layout--mobile">
          <div className="feature-card story-storycard story-storycard--mobile">
            <div className="story-storycard__header">
              <p className="eyebrow">生活情境</p>
              <h3>約 30 年後的生活情境</h3>
            </div>

            {isLoading ? (
              <div className="loading-card story-loading">
                <div className="spinner" />
                <p className="caption">正在生成你的氣候生活情境。</p>
              </div>
            ) : (
              <div className="story-storycard__content">
                <div className="story-copy">
                  {paragraphs.map((paragraph, index) => (
                    <p key={`${index}-${paragraph.slice(0, 24)}`} className="story-copy__paragraph">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="info-panel story-insight-panel story-insight-panel--mobile">
            <div className="story-insight-panel__header">
              <p className="eyebrow">在地變化</p>
              <h3>你所在地正在出現的變化</h3>
            </div>

            <div className="story-signal-brief">
              {signalCards.map((card) => (
                <article key={card.label} className="story-signal-brief__item">
                  <p className="story-signal-card__label story-signal-brief__label">{card.label}</p>
                  <div className="story-signal-brief__content">
                    <h4>{card.value}</h4>
                    <p>{card.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>

        <div className="story-footer">
          <div className="story-actions story-actions--mobile">
            <PrimaryButton onClick={onNext} size="lg">
              進入偏好測驗
            </PrimaryButton>
            <SecondaryButton
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              回到段落開頭
            </SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StorySegment;
