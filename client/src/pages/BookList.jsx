import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import BookCard from '../components/BookCard';
import AddBookModal from '../components/AddBookModal';
import CollectionManagerModal from '../components/CollectionManagerModal';
import useDebounce from '../hooks/useDebounce';

const STATUSES = ['전체', '읽는 중', '완독', '읽고 싶음'];
const PAGE_SIZE = 21;

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

export default function BookList() {
  const [status, setStatus] = useState('전체');
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showCollectionManager, setShowCollectionManager] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data: books = [], isPending } = useQuery({
    queryKey: ['books', status, debouncedSearch],
    queryFn: () => {
      const params = {};
      if (status !== '전체') params.status = status;
      if (debouncedSearch) params.search = debouncedSearch;
      return api.getBooks(params);
    },
  });

  const availableYears = useMemo(() => {
    const years = new Set();
    books.forEach((b) => { if (b.end_date) years.add(b.end_date.slice(0, 4)); });
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [books]);

  const filtered = year ? books.filter((b) => b.end_date?.startsWith(year)) : books;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleStatusChange(s) { setStatus(s); setPage(1); }
  function handleSearchChange(e) { setSearch(e.target.value); setPage(1); }
  function handleYearChange(e)   { setYear(e.target.value); setPage(1); }

  return (
    <>
      <div className="header-actions">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">나의 서재</h1>
          <p className="page-subtitle">
            {filtered.length}권{year && books.length !== filtered.length ? ` / 전체 ${books.length}권` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={() => setShowCollectionManager(true)}>
            컬렉션 관리
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + 책 추가
          </button>
        </div>
      </div>

      <div className="filter-bar">
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`filter-btn${status === s ? ' active' : ''}`}
            onClick={() => handleStatusChange(s)}
          >
            {s}
          </button>
        ))}

        {availableYears.length > 0 && (
          <select
            className={`year-select${year ? ' has-value' : ''}`}
            value={year}
            onChange={handleYearChange}
          >
            <option value="">연도 전체</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        )}

        <input
          className="search-input"
          placeholder="제목 · 저자 검색"
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {isPending ? (
        <div className="loading-wrap">
          <span className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-text">
            {search || year ? '검색 결과가 없습니다' : '첫 번째 책을 추가해보세요'}
          </div>
        </div>
      ) : (
        <>
          <div className="book-grid">
            {paginated.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="pagination">
              <button
                className="pagination-btn pagination-btn--nav"
                onClick={() => setPage((p) => p - 1)}
                disabled={safePage === 1}
                aria-label="이전 페이지"
              >
                ‹
              </button>

              {getPageNumbers(safePage, totalPages).map((n, i) =>
                n === '…' ? (
                  <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
                ) : (
                  <button
                    key={n}
                    className={`pagination-btn${safePage === n ? ' active' : ''}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                )
              )}

              <button
                className="pagination-btn pagination-btn--nav"
                onClick={() => setPage((p) => p + 1)}
                disabled={safePage === totalPages}
                aria-label="다음 페이지"
              >
                ›
              </button>
            </nav>
          )}
        </>
      )}

      {showModal && <AddBookModal onClose={() => setShowModal(false)} />}
      {showCollectionManager && <CollectionManagerModal onClose={() => setShowCollectionManager(false)} />}
    </>
  );
}
