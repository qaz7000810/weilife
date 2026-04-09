function RiskBadge({ tone = "neutral", children }) {
  return <span className={`risk-badge risk-badge--${tone}`}>{children}</span>;
}

export default RiskBadge;
