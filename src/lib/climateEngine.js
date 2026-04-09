import hotDaysRaw from "../data/極端高溫持續指數.json";
import januaryTempRaw from "../data/1月月均溫.json";
import julyTempRaw from "../data/7月月均溫.json";
import seaLevelRiskRaw from "../data/海平面上升風險.json";
import rainDaysRaw from "../data/雨日.json";
import rainIntensityRaw from "../data/雨日降雨強度分類.json";

const SCORE_MAP = {
  A: { happiness: 10, adaptability: 5, convenience: 20, live: 20, comfortable: 25 },
  B: { happiness: 15, adaptability: 10, convenience: 20, live: 15, comfortable: 15 },
  C: { happiness: 20, adaptability: 20, convenience: 15, live: 10, comfortable: 20 },
  D: { happiness: 30, adaptability: 30, convenience: 30, live: 25, comfortable: 30 },
};

const PERSONA_MAP = {
  A: "T1",
  B: "T2",
  C: "T3",
  D: "T4",
};

const PREFERENCE_LABELS = {
  happiness: "生活彈性",
  adaptability: "調適意願",
  convenience: "移動便利",
  live: "居住韌性",
  comfortable: "氣候舒適",
};

const AREA_LABELS = {
  living: "居住",
  transport: "交通",
  travel: "旅遊",
};

const PERSONA_STYLE_SUMMARY = {
  T1: "你比較在意空間的濕度、降雨節奏與居住環境是否友善，遇到水氣與雨勢變化時會特別有感。",
  T2: "你對氣候波動很敏感，尤其在高溫、舒適度與空氣變化上，通常會比別人更早察覺不對勁。",
  T3: "你重視陽光、戶外感與靠近自然的生活節奏，旅遊與休閒場景會是你最先感受到變化的地方。",
  T4: "你傾向先觀察風險再做安排，遇到不穩定的氣候條件時，會直覺地尋找更穩妥的生活方式。",
};

const SCORE_BASELINES = {
  living: 58,
  transport: 52,
  travel: 61,
  overall: 57,
};

export function buildRegionKey(userData = {}) {
  const county = userData.county?.trim();
  const town = userData.town?.trim();
  if (!county || !town) return "";
  return `${county}_${town}`;
}

export function formatRegionName(regionKey) {
  return regionKey ? regionKey.replace(/_/g, " ") : "未指定地區";
}

export function parseMetric(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function roundMetric(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Number(value.toFixed(digits));
}

export function formatDelta(value, suffix = "", digits = 1) {
  if (value === null || value === undefined) return "資料不足";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}${suffix}`;
}

export function calculatePreferenceScores(answers = []) {
  const scores = {
    happiness: 0,
    adaptability: 0,
    convenience: 0,
    live: 0,
    comfortable: 0,
  };

  answers.forEach((answer) => {
    const answerScores = SCORE_MAP[answer] || SCORE_MAP.A;
    Object.keys(scores).forEach((key) => {
      scores[key] += answerScores[key];
    });
  });

  Object.keys(scores).forEach((key) => {
    scores[key] = Math.min(Math.round((scores[key] / 200) * 100), 100);
  });

  return scores;
}

export function getDominantAnswer(answers = []) {
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  answers.forEach((answer) => {
    if (counts[answer] !== undefined) {
      counts[answer] += 1;
    }
  });

  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] || "A";
}

export function getPersonalityType(answers = []) {
  return PERSONA_MAP[getDominantAnswer(answers)] || "T1";
}

export function getPreferenceExtremes(scores = {}) {
  const entries = Object.entries(scores).map(([key, value]) => ({
    key,
    label: PREFERENCE_LABELS[key] || key,
    value,
  }));

  const sorted = [...entries].sort((left, right) => right.value - left.value);
  return {
    strongest: sorted.slice(0, 2),
    weakest: sorted.slice(-2).reverse(),
  };
}

export function getProjectedAge(age) {
  const parsedAge = Number(age);
  if (!Number.isFinite(parsedAge)) return null;
  return parsedAge + 30;
}

export function getLifeStageLabel(age) {
  if (!Number.isFinite(age)) return "未指定";
  if (age <= 40) return "青年";
  if (age <= 65) return "壯年";
  return "熟齡";
}

export function getScenarioImage(age) {
  const stage = getLifeStageLabel(age);
  const fileMap = {
    青年: "youth.jpg",
    壯年: "adult.jpg",
    熟齡: "elder.jpg",
  };
  return fileMap[stage] || "adult.jpg";
}

export function getRegionSignals(regionKey) {
  const january = januaryTempRaw[regionKey] || {};
  const july = julyTempRaw[regionKey] || {};
  const rainDays = rainDaysRaw[regionKey] || {};
  const hotDays = hotDaysRaw[regionKey] || {};
  const rainIntensity = rainIntensityRaw[regionKey]?.["雨日降雨強度分類"] || null;
  const seaLevelRisk = seaLevelRiskRaw[regionKey]?.["海平面上升風險"];

  return {
    january: {
      base: parseMetric(january["1月月均溫_基期"]),
      future: parseMetric(january["1月月均溫_GWL4.0"]),
      change: parseMetric(january["1月月均溫_CHANGE"]),
    },
    july: {
      base: parseMetric(july["7月月均溫_基期"]),
      future: parseMetric(july["7月月均溫_GWL4.0"]),
      change: parseMetric(july["7月月均溫_CHANGE"]),
    },
    rainDays: {
      base: parseMetric(rainDays["雨日rr1_基期"]),
      future: parseMetric(rainDays["雨日rr1_GWL4.0"]),
      change: parseMetric(rainDays["雨日rr1_CHANGE"]),
    },
    hotDays: {
      base: parseMetric(hotDays["極端高溫_基期"]),
      future: parseMetric(hotDays["極端高溫_GWL4.0"]),
      change: parseMetric(hotDays["極端高溫_CHANGE"]),
    },
    rainIntensity,
    seaLevelRisk: seaLevelRisk === 0 || seaLevelRisk === 1 ? seaLevelRisk : null,
  };
}

export function getRainIntensityTone(level) {
  if (level === "高") return { label: "強降雨敏感", tone: "high", detail: "短延時強降雨與排水壓力較高。" };
  if (level === "中") return { label: "降雨波動", tone: "medium", detail: "需預留午後陣雨與局部積水風險。" };
  if (level === "低") return { label: "雨勢相對穩定", tone: "low", detail: "仍需留意季節性天氣轉變。" };
  return { label: "資料不足", tone: "neutral", detail: "目前缺少降雨強度分類。" };
}

export function getHeatTone(hotChange) {
  if (hotChange === null) return { label: "資料不足", tone: "neutral", detail: "尚無高溫變化資料。" };
  if (hotChange >= 100) return { label: "熱浪壓力高", tone: "high", detail: "長時間戶外活動與通勤壓力明顯提高。" };
  if (hotChange >= 60) return { label: "高溫升溫明顯", tone: "medium", detail: "需重新安排外出時段與室內降溫策略。" };
  return { label: "高溫仍需管理", tone: "low", detail: "日常補水、遮陽與空間通風仍是必要基本盤。" };
}

export function getSeaLevelTone(risk) {
  if (risk === 1) return { label: "沿海淹水風險", tone: "high", detail: "低窪區居住選擇、排水與保險規劃更重要。" };
  if (risk === 0) return { label: "海平面風險較低", tone: "low", detail: "主要關注點將轉向高溫與降雨衝擊。" };
  return { label: "資料不足", tone: "neutral", detail: "尚無海平面上升風險資料。" };
}

export function scoreToStatus(score) {
  if (score === null || score === undefined) {
    return { label: "資料不足", tone: "neutral", description: "暫時無法判定此面向的風險狀態。", educationLabel: "暫時無法判讀" };
  }
  if (score >= 70) {
    return { label: "相對穩健", tone: "low", description: "具備較好的適應空間，但仍需維持日常調整。", educationLabel: "風險感受較低" };
  }
  if (score >= 55) {
    return { label: "需持續留意", tone: "medium", description: "整體可應對，但遇到極端事件時需要備援方案。", educationLabel: "風險感受中等" };
  }
  if (score >= 40) {
    return { label: "敏感度偏高", tone: "medium", description: "生活安排容易受到氣候波動影響，建議提早規劃。", educationLabel: "風險感受偏高" };
  }
  return { label: "高風險敏感", tone: "high", description: "此面向在未來情境下較脆弱，需要具體的預防與應變。", educationLabel: "風險感受很高" };
}

function describeAreaScore(area, score) {
  const status = scoreToStatus(score);
  if (area === "living") return `居住面向目前屬於「${status.label}」，代表你未來會更常感受到住家舒適、排水與居住安全的差異。`;
  if (area === "transport") return `交通面向目前屬於「${status.label}」，代表你在外出、通勤與移動安排上，會明顯受到高溫或暴雨影響。`;
  return `旅遊面向目前屬於「${status.label}」，代表你安排出遊、戶外活動與休閒方式時，需要更常判斷天氣風險。`;
}

function buildEvidenceItem(label, value, detail) {
  return { label, value, detail };
}

function compareToBaseline(score, baseline) {
  if (score === null || score === undefined) {
    return "暫時無法與平均比較。";
  }

  const diff = Math.round(score - baseline);
  if (Math.abs(diff) <= 3) {
    return "和目前平均感受接近。";
  }
  if (diff > 0) {
    return `比平均更穩一些，約高出 ${diff} 分。`;
  }
  return `比平均更容易感受到風險，約低了 ${Math.abs(diff)} 分。`;
}

function buildLifeImpact(area, score, signals) {
  const heat = getHeatTone(signals.hotDays.change);
  const rain = getRainIntensityTone(signals.rainIntensity);
  const sea = getSeaLevelTone(signals.seaLevelRisk);

  if (area === "living") {
    return score < 55
      ? `你可能會更在意住家悶熱、排水與低窪區安全感，尤其在 ${rain.label} 或 ${sea.label} 的情境下更明顯。`
      : `你的居住感受相對穩定，但當 ${heat.label} 或連續降雨出現時，住家舒適度與防災準備仍會成為關鍵。`;
  }

  if (area === "transport") {
    return score < 55
      ? `你在通勤時最容易被高溫曝曬、午後暴雨或臨時改道打亂節奏。`
      : `你的移動方式還有適應空間，但一旦遇到 ${heat.label} 或 ${rain.label}，備援路線仍很重要。`;
  }

  return score < 55
    ? `你安排旅遊時，會比別人更常遇到熱浪、下雨或行程被迫改動的情況。`
    : `你的旅遊彈性相對較高，但在夏季升溫與強降雨變化下，戶外活動仍需要更早安排。`;
}

function buildStoryCallbacks(signals) {
  const callbacks = [];

  if (signals.hotDays.change !== null && signals.hotDays.change >= 60) {
    callbacks.push({
      id: "heat",
      title: "故事裡反覆出現的熱浪感",
      description: "這對應到極端高溫日數增加。未來你會更常遇到白天不想久待戶外、移動時想找陰影與冷氣空間的情況。",
    });
  }

  if (signals.rainIntensity === "高" || signals.rainIntensity === "中") {
    callbacks.push({
      id: "rain",
      title: "故事中的午後大雨與積水",
      description: "這對應到降雨型態改變。不是每天都下雨，而是更容易遇到來得急、影響生活節奏的雨勢。",
    });
  }

  if (signals.seaLevelRisk === 1) {
    callbacks.push({
      id: "sea",
      title: "故事中的沿海與低窪不安感",
      description: "這對應到海平面上升與低地淹水風險。你會更在意住家位置、排水能力與長期居住安全。",
    });
  }

  if (!callbacks.some((item) => item.id === "mobility")) {
    callbacks.push({
      id: "mobility",
      title: "故事裡為什麼你開始重新安排出門方式",
      description:
        signals.rainIntensity === "高" || signals.rainIntensity === "中"
          ? "因為現在更需要替通勤與回家預留備案。雨勢不一定每天都來，但一來就足以讓原本的移動節奏被打斷。"
          : "即使沒有最劇烈的降雨風險，高溫與天氣波動也會讓你更常提早出門、換路線，或優先選擇有冷氣和遮蔭的移動方式。",
    });
  }

  if (!callbacks.some((item) => item.id === "travel")) {
    callbacks.push({
      id: "travel",
      title: "故事裡為什麼旅行不再只看景點",
      description:
        (signals.hotDays.change ?? 0) >= 60
          ? "因為戶外停留時間會先被高溫壓縮，你需要比以前更早決定出發時段、備案景點與補水節奏。"
          : "因為天氣節奏變得更不穩定，旅行安排會越來越依賴是否容易轉成室內、是否方便調整行程。",
    });
  }

  if (callbacks.length === 0) {
    callbacks.push({
      id: "general",
      title: "故事中的生活變化感",
      description: "即使沒有單一極端風險特別突出，氣候變化仍會慢慢改變你對舒適、移動與出遊的習慣。",
    });
  }

  return callbacks.slice(0, 3);
}

function buildLifeSummary(personalityType, signals, preferenceExtremes) {
  const personaSummary = PERSONA_STYLE_SUMMARY[personalityType] || "你會用自己的生活節奏去感受氣候變化。";
  const strong = preferenceExtremes.strongest[0]?.label || "生活偏好";
  const weak = preferenceExtremes.weakest[0]?.label || "風險敏感點";
  const heat = getHeatTone(signals.hotDays.change);
  const rain = getRainIntensityTone(signals.rainIntensity);

  return `${personaSummary} 這次測驗顯示你最明顯的特徵是「${strong}」，而最容易被牽動的則是「${weak}」。當 ${heat.label} 與 ${rain.label} 一起出現時，你會比平常更明顯感受到生活節奏被改變。`;
}

function buildRiskTranslation(signals) {
  const items = [];
  const heat = getHeatTone(signals.hotDays.change);
  const rain = getRainIntensityTone(signals.rainIntensity);
  const sea = getSeaLevelTone(signals.seaLevelRisk);

  items.push({
    title: "高溫會先改變你的日常節奏",
    label: heat.label,
    description: heat.detail,
  });

  items.push({
    title: "降雨不只是下雨，而是打亂安排",
    label: rain.label,
    description: rain.detail,
  });

  if (signals.seaLevelRisk !== null) {
    items.push({
      title: "居住安全感也會跟著改變",
      label: sea.label,
      description: sea.detail,
    });
  }

  return items;
}

function buildAreaAnalysis(area, score, signals, profile) {
  const rainfall = getRainIntensityTone(signals.rainIntensity);
  const heat = getHeatTone(signals.hotDays.change);
  const sea = getSeaLevelTone(signals.seaLevelRisk);
  const personaPreference =
    profile?.preferences?.[
      area === "living" ? "residence" : area === "transport" ? "transport" : "tourism"
    ] || "目前無對應的人格偏好資料。";

  if (area === "living") {
    return {
      label: AREA_LABELS[area],
      score,
      status: scoreToStatus(score),
      focusTitle: buildAreaFocusTitle(area),
      summary: describeAreaScore(area, score),
      primaryRisk: buildAreaPrimaryRisk(area, signals),
      reason: `居住分數主要由降雨強度、海平面風險與高溫天數交叉判讀，再與你的生活偏好進行配對。`,
      comparison: compareToBaseline(score, SCORE_BASELINES.living),
      lifeImpact: buildLifeImpact(area, score, signals),
      personalNote: buildAreaPersonalNote(area, personaPreference),
      evidenceTitle: "你住的地方，哪裡最容易先出現壓力",
      feelingTitle: "你在生活裡會先感受到什麼",
      reminderTitle: "最適合你的居住提醒",
      evidence: [
        buildEvidenceItem("雨日降雨強度", signals.rainIntensity || "資料不足", rainfall.detail),
        buildEvidenceItem(
          "海平面上升風險",
          signals.seaLevelRisk === 1 ? "有風險" : signals.seaLevelRisk === 0 ? "風險較低" : "資料不足",
          sea.detail
        ),
        buildEvidenceItem(
          "極端高溫日數變化",
          signals.hotDays.change !== null ? `${formatDelta(signals.hotDays.change, " 天")}` : "資料不足",
          heat.detail
        ),
      ],
      explanation: `你的角色偏好顯示你對居住環境的期待是「${personaPreference}」。當地風險與你的偏好越接近，居住分數就越高。`,
      bestReminder: "先把住家當成避暑與避雨的基地來看，優先補強最容易失守的那一個地方。",
      fallbackAdvice: [
        "優先確認住家排水、遮陽與通風條件，必要時將防水設備列入年度預算。",
        "如果住在低窪或沿海區域，先建立避難動線、保險清單與長期居住備案。",
      ],
    };
  }

  if (area === "transport") {
    return {
      label: AREA_LABELS[area],
      score,
      status: scoreToStatus(score),
      focusTitle: buildAreaFocusTitle(area),
      summary: describeAreaScore(area, score),
      primaryRisk: buildAreaPrimaryRisk(area, signals),
      reason: `交通分數主要由高溫、雨日變化與強降雨風險推估，判斷你在通勤與移動上的脆弱點。`,
      comparison: compareToBaseline(score, SCORE_BASELINES.transport),
      lifeImpact: buildLifeImpact(area, score, signals),
      personalNote: buildAreaPersonalNote(area, personaPreference),
      evidenceTitle: "你出門時，哪一種風險最容易打亂節奏",
      feelingTitle: "你會先在哪個移動瞬間有感",
      reminderTitle: "最適合你的通勤提醒",
      evidence: [
        buildEvidenceItem(
          "極端高溫日數變化",
          signals.hotDays.change !== null ? `${formatDelta(signals.hotDays.change, " 天")}` : "資料不足",
          heat.detail
        ),
        buildEvidenceItem(
          "雨日數變化",
          signals.rainDays.change !== null ? `${formatDelta(signals.rainDays.change, " 天")}` : "資料不足",
          signals.rainDays.change !== null
            ? "降雨天數與時段分布改變，會直接影響通勤穩定性。"
            : "目前缺少雨日變化資料。"
        ),
        buildEvidenceItem("雨日降雨強度", signals.rainIntensity || "資料不足", rainfall.detail),
      ],
      explanation: `你的角色偏好顯示你在移動上較重視「${personaPreference}」。如果偏好與當地氣候條件衝突，交通分數會明顯下降。`,
      bestReminder: "先替自己準備一條熱天版路線和一條暴雨版路線，移動壓力會立刻少很多。",
      fallbackAdvice: [
        "把最常使用的兩條通勤路線做成晴天版與暴雨版，並預留轉乘方案。",
        "高溫日優先安排有遮蔭、可補水或能快速進入室內冷氣空間的移動路徑。",
      ],
    };
  }

  return {
    label: AREA_LABELS[area],
    score,
    status: scoreToStatus(score),
    focusTitle: buildAreaFocusTitle(area),
    summary: describeAreaScore(area, score),
    primaryRisk: buildAreaPrimaryRisk(area, signals),
    reason: `旅遊分數主要由熱浪、溫度變化與降雨波動判讀，評估戶外活動的舒適度與安全性。`,
    comparison: compareToBaseline(score, SCORE_BASELINES.travel),
    lifeImpact: buildLifeImpact(area, score, signals),
    personalNote: buildAreaPersonalNote(area, personaPreference),
    evidenceTitle: "你排行程時，哪種天氣最需要先防",
    feelingTitle: "你會在旅途中先感受到什麼",
    reminderTitle: "最適合你的旅遊提醒",
    evidence: [
      buildEvidenceItem(
        "7 月月均溫變化",
        signals.july.change !== null ? `${formatDelta(signals.july.change, "°C")}` : "資料不足",
        signals.july.change !== null
          ? "夏季升溫會直接改變戶外停留時間與景點安排。"
          : "目前缺少夏季溫度變化資料。"
      ),
      buildEvidenceItem("雨日降雨強度", signals.rainIntensity || "資料不足", rainfall.detail),
      buildEvidenceItem(
        "極端高溫日數變化",
        signals.hotDays.change !== null ? `${formatDelta(signals.hotDays.change, " 天")}` : "資料不足",
        heat.detail
      ),
    ],
    explanation: `你的角色偏好顯示你傾向「${personaPreference}」。旅遊分數反映的是當地氣候是否支撐這種休閒方式。`,
    bestReminder: "先決定能不能舒服地待在戶外，再決定去哪裡，旅行會比硬撐更自在。",
    fallbackAdvice: [
      "下一次安排旅遊時，先看高溫、午後雷雨與遮蔭條件，再決定景點順序。",
      "把清晨時段留給戶外活動，把午後改成室內或可快速撤離的備案行程。",
    ],
  };
}

function rankAreaPriorities(areaScores) {
  return Object.entries(areaScores)
    .map(([key, value]) => ({ key, value }))
    .sort((left, right) => (left.value ?? 0) - (right.value ?? 0));
}

function buildActionPools(signals, areaScores) {
  const pool = [];

  if (signals.hotDays.change !== null && signals.hotDays.change >= 60) {
    pool.push({
      priority: 100,
      now: "今天開始把高曝曬行程調到上午 10 點前或傍晚後，並固定攜帶補水與遮陽裝備。",
      prepare: "未來一年內建立高溫日備援方案，例如室內轉乘點、遠距日或家中降溫設備升級。",
    });
  }

  if (signals.rainIntensity === "高") {
    pool.push({
      priority: 95,
      now: "把通勤與外出路線分成晴天版與暴雨版，雨具、防水鞋與行動電源固定放入日常包。",
      prepare: "針對暴雨與積水情境，規劃家中排水改善、車位評估與社區聯絡清單。",
    });
  }

  if (signals.seaLevelRisk === 1) {
    pool.push({
      priority: 90,
      now: "如果你住在低窪或沿海地帶，先確認避難動線、保險內容與重要文件的防水備份。",
      prepare: "中長期居住選擇要納入海平面與淹水風險，必要時預留搬遷或換屋條件。",
    });
  }

  const rankedAreas = rankAreaPriorities(areaScores);
  rankedAreas.forEach(({ key, value }, index) => {
    if (key === "living" && value < 55) {
      pool.push({
        priority: 80 - index,
        now: "先檢查住家遮陽、通風、排水與樓層條件，找出最需要補強的一個環節。",
        prepare: "把住家韌性列入年度支出，例如窗簾隔熱、防水設備或公共防災物資。",
      });
    }
    if (key === "transport" && value < 55) {
      pool.push({
        priority: 78 - index,
        now: "把大眾運輸、室內轉乘點與替代通勤方式設成極端天氣日的優先方案。",
        prepare: "為工作、上學或照護情境建立可切換的交通備援，包括提早出門或臨時遠距安排。",
      });
    }
    if (key === "travel" && value < 55) {
      pool.push({
        priority: 76 - index,
        now: "下一次旅遊先看熱浪、午後降雨與遮蔭條件，再決定景點順序與停留時間。",
        prepare: "把旅遊規劃從看景點改成看風險條件，建立你自己的氣候友善旅行清單。",
      });
    }
  });

  pool.push(
    {
      priority: 40,
      now: "把你所在地的天氣警報、淹水資訊與高溫提醒加入手機通知，讓決策從『知道』變成『提早準備』。",
      prepare: "每半年回頭檢查一次居住、通勤與旅遊習慣，確認它們是否仍適合新的氣候條件。",
    },
    {
      priority: 30,
      now: "和家人或同住者討論一次極端天氣分工，確認誰負責聯絡、備援與撤離。",
      prepare: "建立家庭版氣候行動清單，讓每個人都知道高溫、暴雨與淹水日要怎麼應對。",
    }
  );

  return pool.sort((left, right) => right.priority - left.priority);
}

function uniqueActions(items, field, limit) {
  const used = new Set();
  return items
    .map((item) => item[field])
    .filter((value) => {
      if (used.has(value)) return false;
      used.add(value);
      return true;
    })
    .slice(0, limit);
}

function buildRiskFlags(signals) {
  const flags = [];
  const heat = getHeatTone(signals.hotDays.change);
  const rain = getRainIntensityTone(signals.rainIntensity);
  const sea = getSeaLevelTone(signals.seaLevelRisk);

  if (heat.tone !== "neutral") {
    flags.push({ id: "heat", label: heat.label, tone: heat.tone, description: heat.detail });
  }
  if (rain.tone !== "neutral") {
    flags.push({ id: "rain", label: rain.label, tone: rain.tone, description: rain.detail });
  }
  if (sea.tone !== "neutral") {
    flags.push({ id: "sea", label: sea.label, tone: sea.tone, description: sea.detail });
  }

  return flags.slice(0, 3);
}

function buildHeadline(overallScore, regionName) {
  const status = scoreToStatus(overallScore);
  return `${regionName} 的未來氣候生活條件目前屬於「${status.label}」，這代表你未來對高溫、降雨與生活安排的感受，會比現在更直接。`;
}

function buildSummarySignals(signals) {
  return [
    {
      label: "夏季升溫",
      value:
        signals.july.change !== null
          ? `${formatDelta(signals.july.change, "°C")}`
          : "資料不足",
      description: "代表戶外活動與室內降溫需求會同步提高。",
    },
    {
      label: "極端高溫天數",
      value:
        signals.hotDays.change !== null
          ? `${formatDelta(signals.hotDays.change, " 天")}`
          : "資料不足",
      description: "用來判斷熱浪對通勤、照護與旅遊的壓力。",
    },
    {
      label: "降雨風險",
      value: signals.rainIntensity || "資料不足",
      description: "反映短時強降雨對移動與住家排水的影響。",
    },
  ];
}

export function buildScenarioHighlights(signals) {
  const rain = getRainIntensityTone(signals.rainIntensity);
  const heat = getHeatTone(signals.hotDays.change);
  const sea = getSeaLevelTone(signals.seaLevelRisk);

  return [
    {
      label: "高溫訊號",
      value:
        signals.hotDays.future !== null ? `${roundMetric(signals.hotDays.future, 0)} 天/年` : "資料不足",
      description: heat.detail,
    },
    {
      label: "降雨型態",
      value: rain.label,
      description: rain.detail,
    },
    {
      label: "沿海風險",
      value: sea.label,
      description: sea.detail,
    },
  ];
}

function buildFallbackStoryTemplateKey(signals) {
  if (signals.seaLevelRisk === 1) return "coastal";
  if (signals.rainIntensity === "高") return "storm";
  if ((signals.hotDays.change ?? 0) >= 90) return "heat";
  return "seasonal";
}

export function buildFallbackStory({ projectedAge, regionName, signals }) {
  const ageLabel = projectedAge ? `${projectedAge} 歲的你` : "未來的你";
  const summerRise =
    signals.july.change !== null ? `${formatDelta(signals.july.change, "°C")}` : "明顯升溫";
  const hotDays =
    signals.hotDays.future !== null ? `${roundMetric(signals.hotDays.future, 0)} 天` : "更多高溫日";
  const heat = getHeatTone(signals.hotDays.change);
  const rain = getRainIntensityTone(signals.rainIntensity);
  const sea = getSeaLevelTone(signals.seaLevelRisk);

  const templates = {
    heat: [
      `2055 年的 ${regionName}，${ageLabel} 已經很少把中午當成可以自在出門的時段。夏天比現在又熱了 ${summerRise}，一年裡大約有 ${hotDays} 讓你一出門就先找陰影、先想哪裡有冷氣，原本十分鐘就能完成的小事，現在也得重新挑時間。`,
      `午後的天氣也不像以前那麼好猜。雨不一定天天下，但一來就會打亂節奏，捷運出口積水、騎車臨時改道、原本熟悉的巷口變得更需要先看天氣再決定怎麼走。你開始把移動想成一種安排，而不是出門就能直接完成的動作。`,
      `連假或週末旅行也變了。你還是想去遠一點的地方散心，但現在會把戶外行程挪到清晨，把午後留給室內場館或能隨時撤退的備案。這段故事不是在誇張未來，而是在提醒你：當 ${heat.label}、${rain.label} 和生活安排疊在一起時，氣候變遷會先從日常節奏開始改寫你怎麼住、怎麼出門、怎麼旅行。`,
    ],
    storm: [
      `到了 2055 年，${regionName} 的生活沒有一天看起來像災難片，卻常常在一場突然而急的雨裡被重新排序。${ageLabel} 早上出門時天色還算穩定，但午後常常在幾十分鐘內轉成大雨，路口排水變慢、騎樓擠滿躲雨的人，原本順手的通勤路線開始需要備案。`,
      `熱也沒有缺席。夏季升溫約 ${summerRise}，高溫日數增加到約 ${hotDays}，所以你不只要閃雨，還得閃開最難受的曝曬時段。你會開始習慣提早出門、改搭有冷氣的交通工具，或把會議、採買和照顧安排集中在比較能忍受的時段裡。`,
      `旅行的方式也跟著變了。你不再只看目的地好不好玩，還會先看那一天的降雨型態、轉乘空間和是否有室內替代方案。這就是氣候教育真正想讓人看懂的地方：${rain.label} 不是單純的「會下雨」，而是會牽動移動、停留時間和整個生活節奏的變化。`,
    ],
    coastal: [
      `2055 年的 ${regionName}，${ageLabel} 早就習慣先看天氣與潮位，再決定今天怎麼安排。白天的熱感比現在更直接，夏季升溫約 ${summerRise}，一旦太陽升高，戶外停留的時間就會被壓縮；但真正讓人提高警覺的，是雨勢、積水與低窪地帶那種慢慢逼近的不安感。`,
      `午後如果遇到大雨，路口的排水速度、回家路上的低窪點、停車的位置，這些以前不太會被放在心上的事，現在都變成日常判斷的一部分。通勤不再只是選最快的路，而是選在 ${rain.label} 或 ${sea.label} 條件下，還能安全回家的路。`,
      `連想去海邊、港邊或水岸散步的旅行方式也改了。你會把海線行程挪到清晨或天氣穩定的日子，把午後改成室內展館、在地市場或可快速撤離的點。這段故事要你看到的是：海平面、暴雨和熱浪不一定會一次爆發，但會一起改變你對居住安全、移動效率和旅遊自由度的想像。`,
    ],
    seasonal: [
      `2055 年的 ${regionName}，氣候變遷不是每天都用劇烈災害提醒你它的存在，而是慢慢改寫你對四季的期待。${ageLabel} 發現夏天比以前更長、更熱，升溫約 ${summerRise}，一年裡出現約 ${hotDays} 的高溫日數讓你開始主動調整出門時間，原本理所當然的白天活動變得需要先看體感。`,
      `下雨的方式也跟著變了。雖然不一定每週都遇到豪雨，但雨勢一旦集中，就足以讓捷運出口、巷口積水或接送安排變得麻煩。你開始更留意天氣通知、轉乘空間和回家路上的遮蔭與排水，因為移動已經不是只考慮快不快，而是舒不舒服、穩不穩定。`,
      `旅行也是最容易察覺變化的地方。以前說走就走，現在會先選比較不曝曬的時段、先找可以臨時改成室內的景點，甚至重新思考哪個季節才真的適合出遊。這些轉變看起來很生活化，卻正是氣候變遷最真實的教育現場：它先改變的，往往不是一個抽象名詞，而是你安排一天與一趟旅程的方法。`,
    ],
  };

  return templates[buildFallbackStoryTemplateKey(signals)].join("\n\n");
}

function buildAreaFocusTitle(area) {
  if (area === "living") return "住得舒不舒服，會先讓你察覺氣候正在改變";
  if (area === "transport") return "出門順不順，最容易暴露氣候壓力";
  return "玩得自在不自在，最能看見天氣節奏已經不同";
}

function buildAreaPrimaryRisk(area, signals) {
  const heat = getHeatTone(signals.hotDays.change);

  if (area === "living") {
    if (signals.seaLevelRisk === 1) {
      return `主要風險是低窪與沿海住家的排水、安全感，以及雨勢來得急時的居住壓力；${heat.label} 會進一步放大悶熱與照護負擔。`;
    }
    if (signals.rainIntensity === "高" || signals.rainIntensity === "中") {
      return `主要風險是連續降雨、午後積水與住家通風排水條件；${heat.label} 會讓室內舒適度問題更容易被放大。`;
    }
    return `主要風險是高溫悶熱與室內降溫負擔，遇到瞬間降雨時仍要注意排水與回家動線。`;
  }

  if (area === "transport") {
    if ((signals.hotDays.change ?? 0) >= 60) {
      return `主要風險是高溫曝曬、體力消耗與通勤時段被迫重新安排；一旦下起急雨，原本順手的路線也可能立刻失效。`;
    }
    return `主要風險是降雨時段更難預測，出門時更常遇到臨時改道、積水或轉乘節奏被打亂。`;
  }

  if ((signals.hotDays.change ?? 0) >= 60) {
    return `主要風險是戶外停留時間被高溫壓縮，旅遊不再只看景點，也得看遮蔭、補水與能不能快速切換到室內。`;
  }
  return `主要風險是行程被陣雨或天氣波動切碎，交通接駁、備案景點與停留節奏會比以前更重要。`;
}

function buildAreaPersonalNote(area, personaPreference) {
  if (area === "living") {
    return `你會特別在意住起來是不是安心、好照顧，也是不是接近你想像中的「${personaPreference}」。`;
  }
  if (area === "transport") {
    return `你會特別在意移動時是否省力、可預期，以及整體節奏是否符合你偏好的「${personaPreference}」。`;
  }
  return `你會特別在意旅行能不能維持原本想像中的節奏，而不是一路被天氣牽著走；這和你偏好的「${personaPreference}」有關。`;
}

export function buildResultAnalysis({
  userData,
  profilesData = {},
  regionScoresData = {},
  totalScoresData = {},
  baseUrl = "/",
}) {
  const regionKey = buildRegionKey(userData);
  const regionName = formatRegionName(regionKey);
  const preferenceScores = calculatePreferenceScores(userData.answers || []);
  const personalityType = getPersonalityType(userData.answers || []);
  const rawProfile = profilesData[personalityType] || {};
  const personalityProfile = {
    ...rawProfile,
    type: personalityType,
    image: rawProfile.image ? `${baseUrl}${rawProfile.image}` : null,
  };

  const regionScores = regionScoresData[regionKey] || {};
  const areaScores = {
    living: parseMetric(regionScores["居住"]) ?? 50,
    transport: parseMetric(regionScores["交通"]) ?? 50,
    travel: parseMetric(regionScores["旅遊"]) ?? 50,
  };
  const overallScore =
    parseMetric(totalScoresData[regionKey]?.["綜合"]) ??
    roundMetric((areaScores.living + areaScores.transport + areaScores.travel) / 3, 0) ??
    50;

  const signals = getRegionSignals(regionKey);
  const riskFlags = buildRiskFlags(signals);
  const preferenceExtremes = getPreferenceExtremes(preferenceScores);
  const areaInsights = {
    living: buildAreaAnalysis("living", areaScores.living, signals, personalityProfile),
    transport: buildAreaAnalysis("transport", areaScores.transport, signals, personalityProfile),
    travel: buildAreaAnalysis("travel", areaScores.travel, signals, personalityProfile),
  };
  const actionPool = buildActionPools(signals, areaScores);
  const actionNow = uniqueActions(actionPool, "now", 3);
  const actionPrepare = uniqueActions(actionPool, "prepare", 2);

  return {
    regionKey,
    regionName,
    projectedAge: getProjectedAge(userData.age),
    lifeStageLabel: getLifeStageLabel(getProjectedAge(userData.age)),
      personalityProfile,
      preferenceScores,
      preferenceExtremes,
      lifeSummary: buildLifeSummary(personalityType, signals, preferenceExtremes),
      overallScore,
      overallStatus: scoreToStatus(overallScore),
      overallComparison: compareToBaseline(overallScore, SCORE_BASELINES.overall),
      headline: buildHeadline(overallScore, regionName),
      summarySignals: buildSummarySignals(signals),
      climateSignals: signals,
      storyCallbacks: buildStoryCallbacks(signals),
      riskTranslations: buildRiskTranslation(signals),
      riskFlags,
      areaScores,
      areaInsights,
      explanations: {
      headline: "人格與輪廓來自你的問答偏好，三大生活面向分數則來自地區氣候資料；平台把兩者交叉後，轉譯成比較容易理解的生活語言。",
      method: [
        "角色結果與氣候適應輪廓：根據 8 題生活選擇問答，描出你比較容易在意哪些氣候變化。",
        "三大面向分數：來自地區資料中的居住、交通、旅遊風險分數與綜合評分。",
        "生活影響與行動建議：把氣候訊號和你的角色偏好交叉後，轉譯成比較容易理解的日常情境。",
      ],
    },
    actionNow,
    actionPrepare,
    shareSummary: {
      title: `你在 ${regionName} 的氣候生活報告`,
      subtitle: buildHeadline(overallScore, regionName),
      badge: `角色：${personalityProfile.name || personalityType}`,
    },
  };
}
