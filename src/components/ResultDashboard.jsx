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
import { ChevronLeft, ChevronRight, Download, Home, Plane, Route, Share2 } from "lucide-react";
import { buildResultAnalysis } from "../lib/climateEngine";
import { PrimaryButton, SecondaryButton } from "./ui/Buttons";
import RiskBadge from "./ui/RiskBadge";

const apiBase =
  import.meta.env.VITE_AI_PROXY_URL ||
  "https://climate-ai-proxy.climate-quiz-yuchen.workers.dev";
const publicShareUrl = "https://qaz7000810.github.io/weilife";
const BRAND_NAME = "WEILIFE Climate Life Report";

const areaConfigs = [
  { key: "living", label: "居住", subtitle: "住起來舒不舒服", apiLabel: "居住", icon: Home },
  { key: "transport", label: "出行", subtitle: "移動會不會變麻煩", apiLabel: "出行", icon: Route },
  { key: "travel", label: "遊憩", subtitle: "出門彈性還剩多少", apiLabel: "遊憩", icon: Plane },
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
          stroke: "#f472b6",
          fill: "#ec4899",
          fillOpacity: 0.22,
        }
      : {
          grid: "rgba(148,163,184,0.28)",
          tick: "#334155",
          stroke: "#ec4899",
          fill: "#f472b6",
          fillOpacity: 0.22,
        };

  const data = [
    { subject: "幸福感", value: scores.happiness || 0 },
    { subject: "適應力", value: scores.adaptability || 0 },
    { subject: "便利性", value: scores.convenience || 0 },
    { subject: "宜居性", value: scores.live || 0 },
    { subject: "舒適度", value: scores.comfortable || 0 },
  ];

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius={outerRadius} margin={margin}>
          <PolarGrid stroke={palette.grid} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: palette.tick, fontSize: labelSize, fontWeight: 700 }}
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

function getAreaScoreTone(score) {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
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
  const [resultPage, setResultPage] = useState("summary");

  useEffect(() => {
    let isMounted = true;

    async function loadAnalysis() {
      if (!userData?.answers?.length) {
        setError("缺少測驗答案，請重新開始。");
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
        console.error("Failed to build result analysis.", fetchError);
        if (!isMounted) return;
        setError("結果資料載入失敗，請稍後再試。");
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
            console.error(`${area.label} advice failed.`, adviceError);
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
          <p className="caption">正在整理你的結果。</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="surface-card">
        <div className="surface-card__body loading-card">
          <p className="caption">{error || "目前無法顯示結果。"}</p>
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
  const heroTitle = `你是「${personaName}」`;
  const heroSummary =
    analysis.personalityProfile.story || analysis.personalityProfile.description || analysis.lifeSummary;
  const matchProfile = analysis.personalityProfile.matchProfile || {
    name: analysis.personalityProfile.match,
    image: null,
  };
  const mismatchProfile = analysis.personalityProfile.mismatchProfile || {
    name: analysis.personalityProfile.mismatch,
    image: null,
  };
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
  const primaryAreaLabel = rankedAreas[0]?.label || activeTab.label;

  const shareTitle = `${displayName} 的約 30 年後氣候生活結果`;
  const shareText = `${shareTitle}
${analysis.headline}
我最需要留意的是 ${rankedAreas[0]?.label || activeTab.label}
${publicShareUrl}`;
  const shareFileName = `${BRAND_NAME}-${analysis.regionName}-${personaName}.png`.replace(
    /[\\/:*?"<>|]/g,
    "-"
  );
  const shareAreaItems = rankedAreas.map((area) => ({
    label: area.label,
    value: area.value,
    tone: getAreaScoreTone(area.value),
  }));
  const personaAnsweredCount = analysis.personaComposition[0]?.answeredCount || 0;
  const personaQuestionCount = Math.max(userData.answers?.length || 0, personaAnsweredCount);
  const hasMissingPersonaAnswers = personaQuestionCount > personaAnsweredCount;

  async function captureShareCard() {
    const target = document.getElementById("share-capture-target");
    if (!target) {
      throw new Error("Share card target not found.");
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
        reject(new Error("Failed to create blob."));
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
      setShareStatus("結果圖已下載。");
    } catch (shareError) {
      console.error("Download share card failed.", shareError);
      window.alert("目前無法下載結果圖，請稍後再試。");
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
        console.error("Capture before share failed.", captureError);
      }

      await navigator.share(payload);
      setShareStatus("分享成功。");
    } catch (shareError) {
      if (shareError?.name !== "AbortError") {
        console.error("Share failed.", shareError);
        window.alert("目前無法分享結果，請稍後再試。");
      }
    } finally {
      setShareAction("");
    }
  }

  function handleResultPageChange(nextPage) {
    setResultPage(nextPage);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  return (
    <div className="result-page result-page--product">
      {resultPage === "summary" ? (
        <>
      <section className="surface-card">
        <div className="surface-card__body result-summary result-summary--hero">
          <div className="result-summary__main">
            <div className="result-summary__headline result-summary__headline--hero">
              <p className="eyebrow">測驗結果</p>
              <h2>{heroTitle}</h2>
              <p>{heroSummary}</p>
            </div>

            <div className="result-summary__persona result-summary__persona--hero">
              <div className="result-summary__persona-copy">
                <p className="result-summary__label">未來生活提醒</p>
                <h3>{strongestPreference.label}</h3>
                <p>
                  <strong>{analysis.regionName}</strong>：{analysis.overallStatus.label}，最需要留意
                  {primaryAreaLabel}。
                </p>
              </div>
              {analysis.personalityProfile.image ? (
                <div className="result-summary__avatar result-summary__avatar--hero">
                  <img
                    src={analysis.personalityProfile.image}
                    alt={personaName}
                    className="result-summary__avatar-image"
                  />
                </div>
              ) : null}
            </div>

            <div className="result-summary__insights">
              <div className="result-score-panel result-score-panel--hero">
                <p className="result-summary__label">地區平均分數</p>
                <div className="result-score-panel__value">
                  <span>{analysis.overallScore}</span>
                  <small>/100</small>
                </div>
                <p>{analysis.overallComparison}</p>
              </div>

              <article className="result-focus-card result-focus-card--hero result-relationship-card">
                <p className="result-summary__label">合拍人格</p>
                {matchProfile.image ? (
                  <img
                    src={matchProfile.image}
                    alt={matchProfile.name}
                    className="result-relationship-card__image"
                  />
                ) : null}
                <h4>{matchProfile.name || "資料整理中"}</h4>
              </article>

              <article className="result-focus-card result-focus-card--hero result-focus-card--soft result-relationship-card">
                <p className="result-summary__label">拒絕往來戶</p>
                {mismatchProfile.image ? (
                  <img
                    src={mismatchProfile.image}
                    alt={mismatchProfile.name}
                    className="result-relationship-card__image"
                  />
                ) : null}
                <h4>{mismatchProfile.name || "資料整理中"}</h4>
              </article>
            </div>
          </div>

          <aside className="result-summary__aside result-summary__aside--hero">
            <div className="result-radar-card result-radar-card--product result-radar-card--summary">
              <p className="result-summary__label">偏好雷達圖</p>
              <PreferenceRadar
                scores={analysis.preferenceScores}
                height={220}
                outerRadius={70}
                labelSize={12}
              />
            </div>

            <div className="result-composition-card">
              <div className="result-composition-card__header">
                <p className="result-summary__label">角色組成</p>
                <span className="caption">依答題分布換算</span>
              </div>

              <div className="result-composition-list">
                {analysis.personaComposition.map((item) => (
                  <article key={item.type} className="result-composition-item">
                    <div className="result-composition-item__meta">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="result-composition-item__image"
                        />
                      ) : null}
                      <div>
                        <h4>{item.name}</h4>
                        <p>{item.count} / {userData.answers.length} 題</p>
                      </div>
                    </div>

                    <div className="result-composition-item__stat">
                      <strong>{item.percentage}%</strong>
                      <div className="result-composition-item__bar">
                        <span style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
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
                {shareAction === "download" ? "下載中..." : "下載結果圖"}
                <Download size={16} />
              </SecondaryButton>
              <SecondaryButton type="button" onClick={onRestart}>
                重新測驗
              </SecondaryButton>
            </div>

            {shareStatus ? <p className="caption">{shareStatus}</p> : null}
          </aside>
        </div>
      </section>

      <section className="surface-card">
        <div className="surface-card__body result-composition-section">
          <div className="result-composition-card">
            <div className="result-composition-card__header">
              <div>
                <p className="eyebrow">角色組成</p>
                <h3>角色占比</h3>
              </div>
              <div className="result-composition-card__summary">
                <span className="caption">依有效作答換算</span>
                <strong>{personaAnsweredCount} / {personaQuestionCount} 題</strong>
              </div>
            </div>

            {hasMissingPersonaAnswers ? (
              <p className="caption result-composition-card__note">
                目前資料中有 {personaQuestionCount - personaAnsweredCount} 題沒有有效選項，所以角色組成是依已作答題目計算。
              </p>
            ) : null}

            <div className="result-composition-list result-composition-list--section">
              {analysis.personaComposition.map((item) => (
                <article key={item.type} className="result-composition-item">
                  <div className="result-composition-item__meta">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="result-composition-item__image"
                      />
                    ) : null}
                    <div>
                      <h4>{item.name}</h4>
                      <p>{item.count} / {personaQuestionCount} 題</p>
                    </div>
                  </div>

                  <div className="result-composition-item__stat">
                    <strong>{item.percentage}%</strong>
                    <div className="result-composition-item__bar">
                      <span style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card">
        <div className="surface-card__body result-page-nav result-page-nav--next">
          <div>
            <p className="eyebrow">第 2 頁</p>
            <h3>查看生活面向與行動建議</h3>
            <p>下一頁會整理你最需要注意的面向、判斷依據、雷達圖與可執行建議。</p>
          </div>
          <PrimaryButton type="button" onClick={() => handleResultPageChange("details")}>
            看詳細報告
            <ChevronRight size={16} />
          </PrimaryButton>
        </div>
      </section>
        </>
      ) : null}

      {resultPage === "details" ? (
        <>
      <section className="surface-card">
        <div className="surface-card__body result-page-nav result-page-nav--back">
          <SecondaryButton type="button" onClick={() => handleResultPageChange("summary")}>
            <ChevronLeft size={16} />
            回到結果摘要
          </SecondaryButton>
          <div>
            <p className="eyebrow">第 2 頁</p>
            <h3>生活面向與行動建議</h3>
          </div>
        </div>
      </section>

      <section className="surface-card">
        <div className="surface-card__body result-priority">
          <div className="result-section-heading">
            <div>
              <p className="eyebrow">先看這裡</p>
              <h3>{analysis.regionName}的三個生活面向分數</h3>
            </div>
            <p className="result-area-hint">點選面向切換下方分析</p>
          </div>

          <div className="result-area-list result-area-list--cards">
            {rankedAreas.map((area) => {
              const Icon = area.icon;
              const isActive = area.key === activeArea;
              const scoreTone = getAreaScoreTone(area.value);

              return (
                <button
                  key={area.key}
                  type="button"
                  className={`result-area-button result-area-button--hero result-area-button--score-${scoreTone} ${
                    isActive ? "is-active" : ""
                  }`}
                  onClick={() => setActiveArea(area.key)}
                >
                  <div className="result-area-button__top">
                    <span className="hero-highlight">
                      <Icon size={16} />
                      {area.label}
                    </span>
                    <RiskBadge tone={area.insight.status.tone}>{area.insight.status.label}</RiskBadge>
                  </div>
                  <div className="result-area-button__score">
                    <strong className="result-area-button__score-value">{area.value} / 100</strong>
                    <p>{area.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className={`area-card area-card--${activeTab.key} area-card--focused`}>
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
                <div className={`score-pill score-pill--${getAreaScoreTone(activeInsight.score)}`}>
                  <span className="score-pill__value">{activeInsight.score}</span>
                  <span className="score-pill__suffix">/100</span>
                </div>
              </div>
            </div>

            <div className="result-analysis-panel">
              <div className="result-detail-grid">
                <article className="feature-card result-detail-card result-detail-card--full">
                  <div className="result-detail-card__heading">
                    <div>
                      <p className="result-summary__label">判斷依據</p>
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
                      <p className="result-summary__label">建議內容</p>
                      <h4>{activeInsight.reminderTitle}</h4>
                    </div>
                  </div>

                  {loadingMap[activeArea] ? (
                    <p className="caption">正在整理這個面向的建議...</p>
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
        </div>
      </section>

      <section className="surface-card">
        <div className="surface-card__body result-actions">
            <div className="result-section-heading">
              <div>
                <p className="eyebrow">更多內容</p>
                <h3>這個分數怎麼來的</h3>
              </div>
            </div>

            <div className="result-disclosure-list">
              <details className="result-disclosure" open>
                <summary>分數來源</summary>
                <div className="result-disclosure__body">
                  <p className="caption">{analysis.explanations.headline}</p>
                  <ul className="data-list">
                    {analysis.explanations.method.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </details>
            </div>
          </div>
      </section>
        </>
      ) : null}

      <div id="share-capture-target" className="share-capture share-capture--hidden" aria-hidden="true">
        <div className="share-capture__content">
          <div className="share-capture__header">
            <p className="share-capture__brandline">CLIMATE LIFE REPORT</p>
            <p className="share-capture__brand">{analysis.regionName}</p>
          </div>

          <div className="share-capture__hero">
            <div className="share-capture__role-panel">
              <div className="share-capture__role-copy">
                <p className="share-capture__label">你的氣候人格</p>
                <h3 className="share-capture__title">{heroTitle}</h3>
                <p className="share-capture__persona-line">{heroSummary}</p>
              </div>
              {analysis.personalityProfile.image ? (
                <img
                  src={analysis.personalityProfile.image}
                  alt={personaName}
                  className="share-capture__avatar"
                />
              ) : null}
            </div>

            <div className="share-capture__score-panel">
              <p className="share-capture__label">地區平均分數</p>
              <div className="share-capture__score">
                <span>{analysis.overallScore}</span>
                <small>/100</small>
              </div>
              <p>{analysis.overallComparison}</p>
            </div>
          </div>

          <div className="share-capture__area-grid">
            {shareAreaItems.map((item) => (
              <div
                key={item.label}
                className={`share-capture__area-item share-capture__area-item--${item.tone}`}
              >
                <p className="share-capture__summary-label">{item.label}</p>
                <h4 className="share-capture__summary-value">{item.value} / 100</h4>
              </div>
            ))}
          </div>

          <div className="share-capture__bottom">
            <div className="share-capture__relationship-grid">
              <div className="share-capture__relationship-item">
                <p className="share-capture__summary-label">合拍人格</p>
                {matchProfile.image ? (
                  <img src={matchProfile.image} alt={matchProfile.name} />
                ) : null}
                <h4>{matchProfile.name || "資料整理中"}</h4>
              </div>
              <div className="share-capture__relationship-item">
                <p className="share-capture__summary-label">拒絕往來戶</p>
                {mismatchProfile.image ? (
                  <img src={mismatchProfile.image} alt={mismatchProfile.name} />
                ) : null}
                <h4>{mismatchProfile.name || "資料整理中"}</h4>
              </div>
            </div>

            <div className="share-capture__radar-panel">
              <p className="share-capture__label">偏好雷達圖</p>
              <PreferenceRadar
                scores={analysis.preferenceScores}
                height={184}
                outerRadius={54}
                labelSize={10}
                margin={{ top: 18, right: 34, bottom: 16, left: 34 }}
              />
            </div>
          </div>

          <div className="share-capture__footer">
            <span>{BRAND_NAME}</span>
            <span>{publicShareUrl}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultDashboard;
