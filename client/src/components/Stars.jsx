import "./styles/Stars.css";

function Stars({ value, label, showValue = false }) {
  const rating = value == null ? null : Math.min(5, Math.max(0, Number(value)));
  const filled = Math.round(rating || 0);
  const text = rating != null ? rating.toFixed(1) : "-";

  return (
    <span 
     className="stars"
     role="img"
     aria-label={label ?? (rating != null ? `${text} out of 5` : "No rating")}
    >
      {[1, 2, 3, 4, 5].map((position) => (
        <span
          key={position}
          className={position <= filled ? "star star-filled" : "star"}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
      {showValue && (
        <span className="stars-value" aria-hidden="true">
          {text}
        </span>
      )}
    </span>
  );
}

export default Stars;