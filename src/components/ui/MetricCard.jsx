function MetricCard({ label, value, description, tone = "neutral" }) {
  return (
    <div className={`metric-card metric-card--${tone}`}>
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
      {description ? <p className="metric-card__description">{description}</p> : null}
    </div>
  );
}

export default MetricCard;
