import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import QuoteCard from '../components/QuoteCard';
import QuoteDetailModal from '../components/QuoteDetailModal';

export default function QuoteCollection() {
  const [bookFilter, setBookFilter] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [wordSearch, setWordSearch] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);

  const { data: quotes = [], isPending } = useQuery({
    queryKey: ['quotes'],
    queryFn: api.getQuotes,
  });

  const booksWithQuotes = useMemo(() => {
    const seen = new Set();
    return quotes
      .filter((q) => q.book_title && !seen.has(q.book_id) && seen.add(q.book_id))
      .map((q) => ({ id: q.book_id, title: q.book_title }));
  }, [quotes]);

  const filtered = useMemo(() => {
    const b = bookSearch.toLowerCase();
    const w = wordSearch.toLowerCase();
    return quotes.filter((q) => {
      if (bookFilter && String(q.book_id) !== bookFilter) return false;
      if (b && !q.book_author?.toLowerCase().includes(b) && !q.book_title?.toLowerCase().includes(b)) return false;
      if (w && !q.text?.toLowerCase().includes(w)) return false;
      return true;
    });
  }, [quotes, bookFilter, bookSearch, wordSearch]);

  const hasSearch = bookSearch || wordSearch;
  const clearSearch = () => { setBookSearch(''); setWordSearch(''); };

  return (
    <>
      <div className="header-actions">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">문장 모음</h1>
          <p className="page-subtitle">{filtered.length}개</p>
        </div>
      </div>

      {booksWithQuotes.length > 0 && (
        <div className="filter-bar">
          <button
            className={`filter-btn${!bookFilter ? ' active' : ''}`}
            onClick={() => setBookFilter('')}
          >
            전체
          </button>
          {booksWithQuotes.map((b) => (
            <button
              key={b.id}
              className={`filter-btn${bookFilter === String(b.id) ? ' active' : ''}`}
              onClick={() => setBookFilter(String(b.id))}
            >
              {b.title}
            </button>
          ))}
        </div>
      )}

      <div className="quote-search-bar">
        <input
          className="quote-search-input"
          placeholder="저자 · 책 이름"
          value={bookSearch}
          onChange={(e) => setBookSearch(e.target.value)}
        />
        <input
          className="quote-search-input"
          placeholder="단어 · 문장"
          value={wordSearch}
          onChange={(e) => setWordSearch(e.target.value)}
        />
        {hasSearch && (
          <button className="quote-search-clear" onClick={clearSearch}>초기화</button>
        )}
      </div>

      {isPending ? (
        <div className="loading-wrap"><span className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-text">
            {hasSearch || bookFilter ? '검색 결과가 없습니다' : '수집한 문장이 없습니다'}
          </div>
        </div>
      ) : (
        filtered.map((q) => (
          <QuoteCard
            key={q.id}
            quote={q}
            showBook
            onClick={() => setSelectedQuote(q)}
          />
        ))
      )}

      {selectedQuote && (
        <QuoteDetailModal
          quote={selectedQuote}
          onClose={() => setSelectedQuote(null)}
        />
      )}
    </>
  );
}
