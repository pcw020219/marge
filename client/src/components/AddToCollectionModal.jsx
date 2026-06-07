import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export default function AddToCollectionModal({ book, onClose }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');

  const { data: allCollections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: api.getCollections,
  });

  const { data: bookCollections = [] } = useQuery({
    queryKey: ['book-collections', book.id],
    queryFn: () => api.getBookCollections(book.id),
  });

  const bookColIds = new Set(bookCollections.map((c) => c.id));

  const toggle = async (col) => {
    if (bookColIds.has(col.id)) {
      await api.removeBookFromCollection(col.id, book.id);
    } else {
      await api.addBookToCollection(col.id, book.id);
    }
    queryClient.invalidateQueries({ queryKey: ['book-collections', book.id] });
    queryClient.invalidateQueries({ queryKey: ['collections'] });
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    const res = await api.createCollection(name);
    if (res.error) return;
    await api.addBookToCollection(res.id, book.id);
    setNewName('');
    queryClient.invalidateQueries({ queryKey: ['collections'] });
    queryClient.invalidateQueries({ queryKey: ['book-collections', book.id] });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-add-collection">
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        <h2 className="modal-title">컬렉션에 추가</h2>
        <p className="modal-book-name">「{book.title}」</p>

        {allCollections.length === 0 ? (
          <p className="collection-empty">컬렉션이 없습니다. 아래에서 새로 만드세요.</p>
        ) : (
          <ul className="collection-check-list">
            {allCollections.map((col) => {
              const checked = bookColIds.has(col.id);
              return (
                <li
                  key={col.id}
                  className={`collection-check-item${checked ? ' checked' : ''}`}
                  onClick={() => toggle(col)}
                >
                  <span className="collection-check-icon">{checked ? '✓' : ''}</span>
                  <span className="collection-check-name">{col.name}</span>
                  <span className="collection-check-count">{col.book_count}권</span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="collection-new-row">
          <input
            className="input"
            placeholder="새 컬렉션 만들고 바로 추가…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button className="btn btn-ghost" onClick={handleCreate} disabled={!newName.trim()}>
            만들기
          </button>
        </div>
      </div>
    </div>
  );
}
