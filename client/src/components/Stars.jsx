import "./styles/Stars.css";

function Stars({ value, label }) {
  const filled = Math.round(value || 0);

  return (
    <span className="stars" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((position) => (
        <span
          key={position}
          className={position <= filled ? "star star-filled" : "star"}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default Stars;