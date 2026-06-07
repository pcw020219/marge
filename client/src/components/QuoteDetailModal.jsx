import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function QuoteDetailModal({ quote, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(quote.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('복사 실패', e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className="modal modal-quote" role="dialog" aria-modal="true">
        <button className="modal-close-btn" onClick={onClose} aria-label="닫기">✕</button>
        <div className="quote-detail-text">{quote.text}</div>
        <div className="quote-detail-meta">
          {quote.book_title && (
            <Link
              to={`/books/${quote.book_id}`}
              className="quote-detail-book"
              onClick={onClose}
            >
              {quote.book_title}
            </Link>
          )}
          {quote.page != null && <span>{quote.page}p</span>}
          {quote.memo && <span>{quote.memo}</span>}
        </div>
        <div className="quote-detail-actions">
          <button
            className={`btn ${copied ? 'btn-copy-done' : 'btn-ghost'}`}
            onClick={handleCopy}
          >
            {copied ? '복사됨 ✓' : '복사'}
          </button>
        </div>
      </div>
    </div>
  );
}
