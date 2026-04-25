import {
  ArrowRight,
  BadgeCheck,
} from "lucide-react";
import { PrimaryButton } from "../ui/Buttons";
import "./competition-landing-proposal.css";

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

          <div className="product-landing__hero-copy">
            <h2 className="product-landing__title">
              <span className="product-landing__title-line">氣候占卜師</span>
              <span className="product-landing__title-line">未LIFE</span>
            </h2>
            <p className="product-landing__subtitle">
              用 3 分鐘測出約 30 年後，你更適合怎麼生活。
            </p>
          </div>

          <div className="product-landing__actions">
            <PrimaryButton type="button" size="lg" onClick={onStart}>
              開始測驗
              <ArrowRight size={18} />
            </PrimaryButton>
          </div>

          <section className="product-landing__authors" aria-label="authors">
            <p className="product-landing__authors-label">作者</p>
            <div className="product-landing__authors-grid">
              {authorItems.map((author) => (
                <article key={author.name} className="product-author-item">
                  <h3>{author.name}</h3>
                  <p className="product-author-item__school">{author.school}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

export default CompetitionLandingProposal;
