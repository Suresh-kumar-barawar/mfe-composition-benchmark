export default function Rating({ rate, count }) {
  const pct = Math.max(0, Math.min(100, (rate / 5) * 100));
  return (
    <span className="rating" aria-label={`Rated ${rate} out of 5 from ${count} ratings`}>
      <span className="rating__stars" aria-hidden="true">
        <span className="rating__fill" style={{ width: `${pct}%` }}>★★★★★</span>
        ★★★★★
      </span>
      <span className="rating__text">
        {rate.toFixed(1)} ({count})
      </span>
    </span>
  );
}
