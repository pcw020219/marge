export default function StarRating({ value, onChange, readonly = false }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          className={`star${s <= (value || 0) ? ' filled' : ''}${readonly ? ' readonly' : ''}`}
          onClick={readonly ? undefined : () => onChange(s === value ? null : s)}
          tabIndex={readonly ? -1 : 0}
          aria-label={readonly ? undefined : `${s}점`}
        >
          ★
        </button>
      ))}
    </span>
  );
}
