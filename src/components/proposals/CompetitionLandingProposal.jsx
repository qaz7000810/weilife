import { ArrowRight, BadgeCheck, Route, ShieldCheck, Sparkles } from "lucide-react";
import { PrimaryButton } from "../ui/Buttons";
import "./competition-landing-proposal.css";

const featureItems = [
  {
    title: "個人化氣候報告",
    description: "依照你的年齡與所在地，建立專屬的 2055 生活風險報告。",
    icon: Sparkles,
  },
  {
    title: "三個生活面向",
    description: "同步查看居住、交通與旅遊在未來氣候下的變化。",
    icon: Route,
  },
  {
    title: "可直接帶走的建議",
    description: "整理出現在就能做的調整與接下來要提前準備的重點。",
    icon: ShieldCheck,
  },
];

const authorItems = [
  {
    name: "葉珊杉",
    school: "國立中央大學地球科學學系",
  },
  {
    name: "謝侑辰",
    school: "國立彰化師範大學地理學系",
  },
  {
    name: "莊博文",
    school: "臺北市立大學地球環境暨生物資源學系",
  },
];

function CompetitionLandingProposal({ onStart }) {
  return (
    <div className="product-landing">
      <section className="product-landing__hero">
        <div className="product-landing__content">
          <span className="product-landing__eyebrow">
            <BadgeCheck size={16} />
            Climate Life Report
          </span>

          <h2 className="product-landing__title" aria-label="未來氣候占卜師 未LIFE">
            <span>未來氣候占卜師 未LIFE</span>
          </h2>
          <p className="product-landing__subtitle" aria-label="用 3 分鐘看見 2055 年的生活風險與調整方向。">
            <span>用 3 分鐘看見 2055 年的生活</span>
            <span>風險與調整方向。</span>
          </p>
          <p
            className="product-landing__description"
            aria-label="輸入你的年齡與所在地，完成簡短問答後，就能取得一份屬於你的氣候生活報告。"
          >
            <span>輸入你的年齡與所在地，完成簡短問答後，就能取得一份屬於你的氣候生活報告。</span>
          </p>

          <div className="product-landing__actions">
            <PrimaryButton type="button" size="lg" onClick={onStart}>
              開始建立報告
              <ArrowRight size={18} />
            </PrimaryButton>
          </div>
          <section className="product-landing__authors" aria-label="作者">
            <p className="product-landing__authors-label">作者</p>
            <div className="product-landing__authors-grid">
              {authorItems.map((author) => (
                <article key={author.name} className="product-author-card">
                  <h3>{author.name}</h3>
                  <p className="product-author-card__school">{author.school}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section id="product-landing-features" className="product-landing__features">
        {featureItems.map(({ title, description, icon: Icon }) => (
          <article key={title} className="product-feature-card">
            <span className="product-feature-card__icon">
              <Icon size={18} />
            </span>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export default CompetitionLandingProposal;
