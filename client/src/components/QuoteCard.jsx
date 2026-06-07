import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export default function QuoteCard({ quote, showBook = false, onClick }) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('이 문장을 삭제할까요?')) return;
    await api.deleteQuote(quote.id);
    // invalidates both ['quotes'] (QuoteCollection) and ['quotes', bookId] (BookDetail)
    queryClient.invalidateQueries({ queryKey: ['quotes'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(quote.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패', err);
    }
  };

  return (
    <div
      className={`quote-card${onClick ? ' quote-card--clickable' : ''}`}
      onClick={onClick}
    >
      <div className="quote-actions">
        <button
          className={`btn-icon${copied ? ' btn-icon--copied' : ''}`}
          onClick={handleCopy}
          title="복사"
        >
          {copied ? '✓' : '복사'}
        </button>
        <button className="btn-icon btn-icon--delete" onClick={handleDelete} title="삭제">
          ✕
        </button>
      </div>
      <div className="quote-text">{quote.text}</div>
      <div className="quote-meta">
        {quote.page != null && <span>{quote.page}p</span>}
        {showBook && quote.book_title && (
          <Link
            to={`/books/${quote.book_id}`}
            className="quote-book-link"
            onClick={(e) => onClick && e.stopPropagation()}
          >
            {quote.book_title}
          </Link>
        )}
        {quote.memo && <span>{quote.memo}</span>}
      </div>
    </div>
  );
}
