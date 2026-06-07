import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import StarRating from './StarRating';
import BookEditModal from './BookEditModal';
import AddToCollectionModal from './AddToCollectionModal';
import { api } from '../api';

const STATUS_CLASS = { '읽고 싶음': 'want', '읽는 중': 'reading', '완독': 'done' };

export default function BookCard({ book }) {
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm(`"${book.title}"을(를) 삭제할까요?\n수집한 문장도 모두 삭제됩니다.`)) return;
    await api.deleteBook(book.id);
    queryClient.invalidateQueries({ queryKey: ['books'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  };

  return (
    <div className="book-card-wrap" ref={wrapRef}>
      <Link to={`/books/${book.id}`} className="book-card">
        <div className="book-card-title">
          {book.is_favorite ? <span className="card-fav-star">⭐</span> : null}
          {book.title}
        </div>
        {book.author && <div className="book-card-author">{book.author}</div>}
        <div className="book-card-footer">
          <span className={`status-badge status-${STATUS_CLASS[book.status] ?? 'want'}`}>
            {book.status}
          </span>
          {book.rating != null && <StarRating value={book.rating} readonly />}
        </div>
      </Link>

      <button
        className="card-menu-btn"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="메뉴"
        aria-expanded={menuOpen}
      >
        ⋯
      </button>

      {menuOpen && (
        <div className="card-menu-dropdown">
          <button
            className="card-menu-item"
            onClick={() => { setMenuOpen(false); setShowEdit(true); }}
          >
            수정
          </button>
          <button
            className="card-menu-item"
            onClick={() => { setMenuOpen(false); setShowAddToCollection(true); }}
          >
            컬렉션에 추가
          </button>
          <button className="card-menu-item card-menu-item--danger" onClick={handleDelete}>
            삭제
          </button>
        </div>
      )}

      {showEdit && (
        <BookEditModal book={book} onClose={() => setShowEdit(false)} />
      )}

      {showAddToCollection && (
        <AddToCollectionModal book={book} onClose={() => setShowAddToCollection(false)} />
      )}
    </div>
  );
}
