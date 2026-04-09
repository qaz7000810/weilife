import { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import { marked } from "marked";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  Home,
  Lightbulb,
  MapPinned,
  Plane,
  Route,
  Share2,
} from "lucide-react";
import { buildResultAnalysis } from "../lib/climateEngine";
import { PrimaryButton, SecondaryButton } from "./ui/Buttons";
import MetricCard from "./ui/MetricCard";
import RiskBadge from "./ui/RiskBadge";

const apiBase =
  import.meta.env.VITE_AI_PROXY_URL ||
  "https://climate-ai-proxy.climate-quiz-yuchen.workers.dev";
const publicShareUrl = "https://qaz7000810.github.io/weilife";
const BRAND_NAME = "未來氣候占卜師 未LIFE";

const areaConfigs = [
  { key: "living", label: "居住", subtitle: "家與日常環境", apiLabel: "居住", icon: Home },
  { key: "transport", label: "交通", subtitle: "通勤與移動方式", apiLabel: "交通", icon: Route },
  { key: "travel", label: "旅遊", subtitle: "出遊與行程安排", apiLabel: "旅遊", icon: Plane },
];

function PreferenceRadar({
  scores,
  theme = "light",
  height = 260,
  outerRadius = 86,
  labelSize = 12,
  margin = { top: 18, right: 28, bottom: 18, left: 28 },
}) {
  const palette =
    theme === "dark"
      ? {
          grid: "rgba(255,255,255,0.18)",
          tick: "#e2e8f0",
          stroke: "#60a5fa",
          fill: "#2563eb",
          fillOpacity: 0.22,
        }
      : {
          grid: "rgba(148,163,184,0.28)",
          tick: "#334155",
          stroke: "#2563eb",
          fill: "#60a5fa",
          fillOpacity: 0.26,
        };

  const data = [
    { subject: "生活彈性", value: scores.happiness || 0 },
    { subject: "調適意願", value: scores.adaptability || 0 },
    { subject: "移動便利", value: scores.convenience || 0 },
    { subject: "居住韌性", value: scores.live || 0 },
    { subject: "氣候舒適", value: scores.comfortable || 0 },
  ];

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius={outerRadius} margin={margin}>
          <PolarGrid stroke={palette.grid} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: palette.tick, fontSize: labelSize, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />
          <Radar
            dataKey="value"
            stroke={palette.stroke}
            fill={palette.fill}
            fillOpacity={palette.fillOpacity}
            strokeWidth={3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function renderMarkdown(content) {
  return {
    __html: marked.parse(content || ""),
  };
}

function ResultDashboard({ userData, onRestart }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adviceMap, setAdviceMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [shareStatus, setShareStatus] = useState("");
  const [shareAction, setShareAction] = useState("");
  const [activeArea, setActiveArea] = useState("living");

  useEffect(() => {
    let isMounted = true;

    async function loadAnalysis() {
      if (!userData?.answers?.length) {
        setError("缺少作答資料，暫時無法建立你的結果報告。");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [profilesResponse, regionResponse, totalResponse] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}data/personality_profiles.json`),
          fetch(`${import.meta.env.BASE_URL}data/region_scores.json`),
          fetch(`${import.meta.env.BASE_URL}data/totalscores.json`),
        ]);

        const [profilesData, regionScoresData, totalScoresData] = await Promise.all([
          profilesResponse.json(),
          regionResponse.json(),
          totalResponse.json(),
        ]);

        if (!isMounted) return;

        setAnalysis(
          buildResultAnalysis({
            userData,
            profilesData,
            regionScoresData,
            totalScoresData,
            baseUrl: import.meta.env.BASE_URL,
          })
        );
      } catch (fetchError) {
        console.error("讀取結果資料失敗", fetchError);
        if (!isMounted) return;
        setError("結果資料暫時無法載入，請稍後再試。");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAnalysis();

    return () => {
      isMounted = false;
    };
  }, [userData]);

  useEffect(() => {
    let isMounted = true;

    async function loadAdvice() {
      if (!analysis?.regionKey) return;

      const nextLoadingMap = areaConfigs.reduce((accumulator, area) => {
        accumulator[area.key] = true;
        return accumulator;
      }, {});

      setLoadingMap(nextLoadingMap);

      await Promise.allSettled(
        areaConfigs.map(async (area) => {
          try {
            const response = await fetch(`${apiBase}/api/generate-advice`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tab: area.apiLabel,
                region: analysis.regionKey,
              }),
            });

            if (!response.ok) {
              throw new Error(`Advice API ${response.status}`);
            }

            const data = await response.json();
            if (!isMounted) return;
            setAdviceMap((prev) => ({ ...prev, [area.key]: data.result || "" }));
          } catch (adviceError) {
            console.error(`${area.label} 建議載入失敗`, adviceError);
            if (!isMounted) return;
            setAdviceMap((prev) => ({ ...prev, [area.key]: "" }));
          } finally {
            if (isMounted) {
              setLoadingMap((prev) => ({ ...prev, [area.key]: false }));
            }
          }
        })
      );
    }

    loadAdvice();

    return () => {
      isMounted = false;
    };
  }, [analysis?.regionKey]);

  useEffect(() => {
    if (!analysis?.areaScores) return;

    const lowestArea = areaConfigs
      .map((area) => ({ key: area.key, value: analysis.areaScores[area.key] }))
      .sort((left, right) => left.value - right.value)[0]?.key;

    if (lowestArea) {
      setActiveArea(lowestArea);
    }
  }, [analysis]);

  if (loading) {
    return (
      <div className="surface-card">
        <div className="surface-card__body loading-card">
          <div className="spinner" />
          <p className="caption">正在生成你的結果報告。</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="surface-card">
        <div className="surface-card__body loading-card">
          <p className="caption">{error || "結果暫時無法顯示。"}</p>
          <SecondaryButton type="button" onClick={onRestart}>
            重新開始
          </SecondaryButton>
        </div>
      </div>
    );
  }

  const displayName = userData?.name?.trim() || "你";
  const personaName = analysis.personalityProfile.name || analysis.personalityProfile.type;
  const strongestPreference = analysis.preferenceExtremes.strongest[0];
  const weakestPreference = analysis.preferenceExtremes.weakest[0];
  const rankedAreas = areaConfigs
    .map((area) => ({
      ...area,
      value: analysis.areaScores[area.key],
      insight: analysis.areaInsights[area.key],
    }))
    .sort((left, right) => left.value - right.value);
  const activeInsight = analysis.areaInsights[activeArea] || analysis.areaInsights.living;
  const activeTab = areaConfigs.find((item) => item.key === activeArea) || areaConfigs[0];
  const ActiveAreaIcon = activeTab.icon;

  const shareTitle = `${displayName} 的 2055 氣候生活報告`;
  const shareText = `${shareTitle}
${analysis.headline}
最需要留意：${rankedAreas[0]?.label || activeTab.label}
${publicShareUrl}`;
  const shareFileName = `${BRAND_NAME}-${analysis.regionName}-${personaName}.png`.replace(/[\\/:*?"<>|]/g, "-");
  const shareSummaryItems = [
    { label: "角色", value: personaName },
    { label: "地區", value: analysis.regionName },
    { label: "優先面向", value: rankedAreas[0]?.label || activeTab.label },
  ];

  async function captureShareCard() {
    const target = document.getElementById("share-capture-target");
    if (!target) {
      throw new Error("找不到分享卡。");
    }

    const canvas = await html2canvas(target, {
      useCORS: true,
      scale: 2,
      backgroundColor: null,
      logging: false,
    });

    const dataUrl = canvas.toDataURL("image/png", 0.92);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) {
          resolve(value);
          return;
        }
        reject(new Error("分享卡轉換失敗。"));
      }, "image/png");
    });

    return { dataUrl, blob };
  }

  async function handleDownloadShareCard() {
    if (shareAction) return;

    try {
      setShareAction("download");
      setShareStatus("");
      const { dataUrl } = await captureShareCard();
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = shareFileName;
      link.click();
      setShareStatus("分享卡已下載。");
    } catch (shareError) {
      console.error("下載分享卡失敗", shareError);
      window.alert("目前無法下載分享卡，請稍後再試。");
    } finally {
      setShareAction("");
    }
  }

  async function handleShareResult() {
    if (shareAction) return;

    try {
      if (!navigator.share) {
        await handleDownloadShareCard();
        return;
      }

      setShareAction("share");
      setShareStatus("");

      const payload = {
        title: shareTitle,
        text: shareText,
        url: publicShareUrl,
      };

      try {
        const { blob } = await captureShareCard();
        const file = new File([blob], shareFileName, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          payload.files = [file];
        }
      } catch (captureError) {
        console.error("分享卡擷取失敗", captureError);
      }

      await navigator.share(payload);
      setShareStatus("結果已分享。");
    } catch (shareError) {
      if (shareError?.name !== "AbortError") {
        console.error("分享失敗", shareError);
        window.alert("目前無法分享，請稍後再試。");
      }
    } finally {
      setShareAction("");
    }
  }

  return (
    <div className="result-page result-page--product">
      <section className="surface-card">
        <div className="surface-card__body result-summary">
          <div className="result-summary__main">
            <div className="result-summary__topline">
              <span className="hero-highlight">
                <MapPinned size={16} />
                {analysis.regionName}
              </span>
              <RiskBadge tone={analysis.overallStatus.tone}>{analysis.overallStatus.label}</RiskBadge>
            </div>

            <div className="result-summary__headline">
              <h2>{analysis.headline}</h2>
              <p>{analysis.lifeSummary}</p>
            </div>

            <div className="result-summary__persona">
              <div className="result-summary__persona-copy">
                <p className="result-summary__label">你的角色</p>
                <h3>{personaName}</h3>
                <p>{analysis.personalityProfile.description}</p>
              </div>
              {analysis.personalityProfile.image ? (
                <div className="result-summary__avatar">
                  <img
                    src={analysis.personalityProfile.image}
                    alt={personaName}
                    className="result-summary__avatar-image"
                  />
                </div>
              ) : null}
            </div>

            <div className="result-summary__metrics">
              {analysis.summarySignals.map((item) => (
                <MetricCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  description={item.description}
                />
              ))}
            </div>
          </div>

          <aside className="result-summary__aside">
            <div className="result-score-panel">
              <p className="result-summary__label">總體分數</p>
              <div className="result-score-panel__value">
                <span>{analysis.overallScore}</span>
                <small>/100</small>
              </div>
              <p>{analysis.overallComparison}</p>
            </div>

            <div className="result-radar-card result-radar-card--product">
              <p className="result-summary__label">偏好輪廓</p>
              <PreferenceRadar
                scores={analysis.preferenceScores}
                height={248}
                outerRadius={78}
                labelSize={13}
              />
            </div>

            <div className="result-focus-grid">
              <article className="result-focus-card">
                <p className="result-summary__label">最強偏好</p>
                <h4>{strongestPreference.label}</h4>
                <p>{strongestPreference.value} / 100</p>
              </article>
              <article className="result-focus-card result-focus-card--soft">
                <p className="result-summary__label">較弱偏好</p>
                <h4>{weakestPreference.label}</h4>
                <p>{weakestPreference.value} / 100</p>
              </article>
            </div>

            <div className="result-summary__actions">
              <PrimaryButton type="button" onClick={handleShareResult} disabled={Boolean(shareAction)}>
                {shareAction === "share" ? "分享中..." : "分享結果"}
                <Share2 size={16} />
              </PrimaryButton>
              <SecondaryButton
                type="button"
                onClick={handleDownloadShareCard}
                disabled={Boolean(shareAction)}
              >
                {shareAction === "download" ? "下載中..." : "下載分享卡"}
                <Download size={16} />
              </SecondaryButton>
              <SecondaryButton type="button" onClick={onRestart}>
                重新開始
              </SecondaryButton>
            </div>

            {shareStatus ? <p className="caption">{shareStatus}</p> : null}
          </aside>
        </div>
      </section>

      <section className="surface-card">
        <div className="surface-card__body result-priority">
          <div className="result-section-heading">
            <div>
              <p className="eyebrow">Priority</p>
              <h3>優先查看的生活面向</h3>
            </div>
          </div>

          <div className="result-area-list">
            {rankedAreas.map((area) => {
              const Icon = area.icon;
              const isActive = area.key === activeArea;

              return (
                <button
                  key={area.key}
                  type="button"
                  className={`result-area-button ${isActive ? "is-active" : ""}`}
                  onClick={() => setActiveArea(area.key)}
                >
                  <div className="result-area-button__top">
                    <span className="hero-highlight">
                      <Icon size={16} />
                      {area.label}
                    </span>
                    <RiskBadge tone={area.insight.status.tone}>{area.insight.status.educationLabel}</RiskBadge>
                  </div>
                  <h4>{area.subtitle}</h4>
                  <p>{area.insight.summary}</p>
                  <strong>{area.value} / 100</strong>
                </button>
              );
            })}
          </div>

          <div className={`area-card area-card--${activeTab.key} area-card--product`}>
            <div className="area-card__hero">
              <div className="area-card__intro">
                <span className="hero-highlight">
                  <ActiveAreaIcon size={16} />
                  {activeTab.label}
                </span>
                <h3>{activeInsight.focusTitle}</h3>
                <p>{activeInsight.primaryRisk}</p>
              </div>

              <div className="area-card__scorebox">
                <div className="score-pill">
                  <span className="score-pill__value">{activeInsight.score}</span>
                  <span className="score-pill__suffix">/100</span>
                </div>
                <RiskBadge tone={activeInsight.status.tone}>{activeInsight.status.label}</RiskBadge>
              </div>
            </div>

            <div className="result-detail-grid">
              <article className="feature-card result-detail-card">
                <p className="result-summary__label">生活感受</p>
                <h4>{activeInsight.lifeImpact}</h4>
                <p>{activeInsight.comparison}</p>
              </article>

              <article className="feature-card result-detail-card result-detail-card--preference">
                <p className="result-summary__label">偏好對應</p>
                <h4>{activeInsight.personalNote}</h4>
                <p>{activeInsight.explanation}</p>
              </article>

              <article className="feature-card result-detail-card result-detail-card--full">
                <div className="result-detail-card__heading">
                  <div>
                    <p className="result-summary__label">地方證據</p>
                    <h4>{activeInsight.evidenceTitle}</h4>
                  </div>
                </div>

                <ul className="result-evidence-list">
                  {activeInsight.evidence.map((item) => (
                    <li key={item.label}>
                      <strong>{item.label}</strong>
                      <span>{item.value}</span>
                      {item.detail ? <p>{item.detail}</p> : null}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="feature-card result-detail-card result-detail-card--full">
                <div className="result-detail-card__heading">
                  <div>
                    <p className="result-summary__label">行動建議</p>
                    <h4>{activeInsight.reminderTitle}</h4>
                    <p>{activeInsight.bestReminder}</p>
                  </div>
                  <span className="hero-highlight">
                    <Lightbulb size={16} />
                    下一步
                  </span>
                </div>

                {loadingMap[activeArea] ? (
                  <p className="caption">正在整理建議...</p>
                ) : adviceMap[activeArea] ? (
                  <div
                    className="markdown-content result-markdown"
                    dangerouslySetInnerHTML={renderMarkdown(adviceMap[activeArea])}
                  />
                ) : (
                  <ul className="data-list">
                    {activeInsight.fallbackAdvice.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card">
        <div className="surface-card__body result-actions">
          <div className="result-action-board">
            <article className="feature-card result-action-card">
              <p className="result-summary__label">現在就能做</p>
              <h3>優先行動</h3>
              <ul className="data-list">
                {analysis.actionNow.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="feature-card result-action-card result-action-card--prepare">
              <p className="result-summary__label">提前準備</p>
              <h3>接下來要留意</h3>
              <ul className="data-list">
                {analysis.actionPrepare.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <div id="share-capture-target" className="share-capture share-capture--hidden" aria-hidden="true">
        <div className="share-capture__content">
          <div className="share-capture__header">
            <p className="share-capture__brandline">{BRAND_NAME}</p>
            <h3 className="share-capture__title">{shareTitle}</h3>
            <p className="share-capture__brand">{analysis.regionName}</p>
          </div>

          <div className="share-capture__hero">
            <div className="share-capture__role">
              <p className="share-capture__label">你的角色</p>
              <h4>{personaName}</h4>
              <p className="share-capture__persona-line">{analysis.headline}</p>
            </div>

            <div className="share-capture__summary-grid">
              {shareSummaryItems.map((item) => (
                <div key={item.label} className="share-capture__summary-item">
                  <p className="share-capture__summary-label">{item.label}</p>
                  <h4 className="share-capture__summary-value">{item.value}</h4>
                </div>
              ))}
            </div>
          </div>

          <div className="share-capture__visual">
            <div className="share-capture__radar-panel">
              <p className="share-capture__label">偏好輪廓</p>
              <PreferenceRadar
                scores={analysis.preferenceScores}
                theme="dark"
                height={210}
                outerRadius={68}
                labelSize={11}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultDashboard;
