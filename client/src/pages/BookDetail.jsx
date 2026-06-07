import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import StarRating from '../components/StarRating';
import QuoteCard from '../components/QuoteCard';

const STATUS_CLASS = { '읽고 싶음': 'want', '읽는 중': 'reading', '완독': 'done' };

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [savingBook, setSavingBook] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [quotePage, setQuotePage] = useState('');
  const [savingQuote, setSavingQuote] = useState(false);
  const quoteRef = useRef(null);

  // Two independent queries run in parallel
  const { data: book, isPending: bookPending } = useQuery({
    queryKey: ['book', id],
    queryFn: () => api.getBook(id),
  });

  const { data: quotes = [], isPending: quotesPending } = useQuery({
    queryKey: ['quotes', id],
    queryFn: () => api.getQuotes({ book_id: id }),
  });

  // Init form only when navigating to a different book, not on background refetches
  useEffect(() => {
    if (!book) return;
    setForm({
      status:       book.status,
      rating:       book.rating ?? null,
      genre:        book.genre ?? '',
      review:       book.review ?? '',
      start_date:   book.start_date ?? '',
      end_date:     book.end_date ?? '',
      is_favorite:  book.status === '완독' ? (book.is_favorite ?? 0) : 0,
      reread_count: book.status === '완독' ? (book.reread_count ?? 1) : 0,
    });
  }, [book?.id]);

  const handleSaveBook = async () => {
    setSavingBook(true);
    try {
      await api.updateBook(id, {
        ...form,
        rating:       form.rating ?? null,
        genre:        form.genre || null,
        review:       form.review || null,
        start_date:   form.start_date || null,
        end_date:     form.end_date || null,
        is_favorite:  form.is_favorite ? 1 : 0,
        reread_count: Number(form.reread_count),
      });
      queryClient.invalidateQueries({ queryKey: ['book', id] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setEditing(false);
    } finally {
      setSavingBook(false);
    }
  };

  const handleQuickStatus = async (newStatus) => {
    if (newStatus === book.status) return;
    const isDone = newStatus === '완독';
    const newRereadCount = isDone ? Math.max(1, form.reread_count) : 0;
    const newIsFavorite = isDone ? form.is_favorite : 0;
    await api.updateBook(id, { status: newStatus, reread_count: newRereadCount, is_favorite: newIsFavorite });
    setForm((f) => ({ ...f, status: newStatus, reread_count: newRereadCount, is_favorite: newIsFavorite }));
    queryClient.invalidateQueries({ queryKey: ['book', id] });
    queryClient.invalidateQueries({ queryKey: ['books'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  };

  const handleDeleteBook = async () => {
    if (!window.confirm(`"${book.title}"을(를) 삭제할까요?\n수집한 문장도 모두 삭제됩니다.`)) return;
    await api.deleteBook(id);
    queryClient.invalidateQueries({ queryKey: ['books'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    navigate('/');
  };

  const handleQuoteKeyDown = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey && quoteText.trim()) {
      e.preventDefault();
      setSavingQuote(true);
      await api.createQuote({
        book_id: Number(id),
        text: quoteText.trim(),
        page: quotePage ? Number(quotePage) : null,
      });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setQuoteText('');
      setQuotePage('');
      setSavingQuote(false);
      quoteRef.current?.focus();
    }
  };

  if (bookPending || quotesPending) {
    return <div className="loading-wrap"><span className="spinner" /></div>;
  }
  if (!book) return <div className="loading">책을 찾을 수 없습니다</div>;

  return (
    <>
      <Link to="/" className="back-btn">← 서재로</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h1 className="book-detail-title">
            {book.is_favorite ? <span className="detail-fav-star">⭐</span> : null}
            {book.title}
          </h1>
          <div className="book-detail-meta">
            {book.author && <span>{book.author}</span>}
            {book.publisher && <span>{book.publisher}</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {book.rating != null && <StarRating value={book.rating} readonly />}
            {book.start_date && (
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                {book.start_date}{book.end_date && ` → ${book.end_date}`}
              </span>
            )}
            {book.reread_count > 1 && (
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{book.reread_count}회독</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button className="btn btn-ghost" onClick={() => setEditing((e) => !e)}>
            {editing ? '닫기' : '편집'}
          </button>
          <button className="btn btn-danger" onClick={handleDeleteBook}>삭제</button>
        </div>
      </div>

      <div className="status-quick-row">
        {['읽는 중', '완독', '읽고 싶음'].map((s) => (
          <button
            key={s}
            className={`status-quick-btn status-quick-${STATUS_CLASS[s]}${book.status === s ? ' active' : ''}`}
            onClick={() => handleQuickStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {editing && (
        <div className="edit-panel">
          <div className="edit-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">인생책</label>
              <button
                type="button"
                className={`fav-toggle${form.is_favorite ? ' fav-toggle--on' : ''}${form.status !== '완독' ? ' fav-toggle--disabled' : ''}`}
                disabled={form.status !== '완독'}
                onClick={() => setForm((f) => ({ ...f, is_favorite: f.is_favorite ? 0 : 1 }))}
              >
                {form.is_favorite ? '⭐ 인생책' : '☆ 인생책 등록'}
              </button>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">회독 수</label>
              <input
                type="number"
                className="input"
                min="1"
                value={form.reread_count}
                disabled={form.status !== '완독'}
                onChange={(e) => setForm((f) => ({ ...f, reread_count: e.target.value }))}
              />
            </div>
          </div>
          <div className="edit-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">별점</label>
              <div style={{ paddingTop: '0.35rem' }}>
                <StarRating
                  value={form.rating}
                  onChange={(v) => setForm((f) => ({ ...f, rating: v }))}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }} />
          </div>
          <div className="edit-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">시작일</label>
              <input
                type="date"
                className="input"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">완독일</label>
              <input
                type="date"
                className="input"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">분야</label>
            <input
              className="input"
              list="genre-list-detail"
              value={form.genre}
              onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
              placeholder="소설, 자기계발, 역사 …"
            />
            <datalist id="genre-list-detail">
              {['소설', '시/에세이', '자기계발', '경제/경영', '역사', '인문/사회', '과학/기술', '예술/문화', '철학', '여행', '어린이/청소년', '만화'].map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label className="form-label">감상</label>
            <textarea
              className="input"
              value={form.review}
              onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))}
              placeholder="이 책에 대한 생각을 자유롭게 적어보세요"
              rows={4}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSaveBook} disabled={savingBook}>
              {savingBook
                ? <><span className="spinner spinner--sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> 저장 중</>
                : '저장'}
            </button>
          </div>
        </div>
      )}

      {book.review && !editing && (
        <div className="review-card">{book.review}</div>
      )}

      <div className="section-title">문장 수집 {quotes.length > 0 && `(${quotes.length})`}</div>

      <div className="quote-input-area">
        <textarea
          ref={quoteRef}
          className="quote-textarea"
          value={quoteText}
          onChange={(e) => setQuoteText(e.target.value)}
          onKeyDown={handleQuoteKeyDown}
          placeholder="인상 깊은 문장을 입력하고 Enter로 저장하세요…"
          rows={3}
        />
        <div className="quote-input-footer">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="page-input"
            value={quotePage}
            onChange={(e) => setQuotePage(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="페이지 (선택)"
          />
          <span className="quote-hint">
            {savingQuote
              ? <><span className="spinner spinner--sm" /> 저장 중</>
              : 'Enter 저장  ·  Shift+Enter 줄바꿈'}
          </span>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
          <div className="empty-state-icon">✍️</div>
          <div className="empty-state-text">아직 수집한 문장이 없습니다</div>
        </div>
      ) : (
        quotes.map((q) => (
          <QuoteCard key={q.id} quote={q} />
        ))
      )}
    </>
  );
}
