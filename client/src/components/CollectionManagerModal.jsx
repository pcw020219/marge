import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export default function CollectionManagerModal({ onClose }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: api.getCollections,
  });

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setError('');
    const res = await api.createCollection(name);
    if (res.error) { setError(res.error); return; }
    setNewName('');
    queryClient.invalidateQueries({ queryKey: ['collections'] });
  };

  const handleDelete = async (col) => {
    if (!window.confirm(`"${col.name}" 컬렉션을 삭제할까요?\n담긴 책 정보는 유지됩니다.`)) return;
    await api.deleteCollection(col.id);
    queryClient.invalidateQueries({ queryKey: ['collections'] });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-collection-manager">
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        <h2 className="modal-title">컬렉션 관리</h2>

        <div className="collection-create-row">
          <input
            className="input"
            placeholder="새 컬렉션 이름"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button className="btn btn-primary" onClick={handleCreate} disabled={!newName.trim()}>
            만들기
          </button>
        </div>
        {error && <p className="collection-error">{error}</p>}

        {collections.length === 0 ? (
          <p className="collection-empty">아직 컬렉션이 없습니다</p>
        ) : (
          <ul className="collection-list">
            {collections.map((col) => (
              <li key={col.id} className="collection-list-item">
                <span className="collection-list-name">{col.name}</span>
                <span className="collection-list-count">{col.book_count}권</span>
                <button
                  className="btn-icon btn-icon--delete"
                  onClick={() => handleDelete(col)}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
