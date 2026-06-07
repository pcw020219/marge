import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

const INITIAL = { title: '', author: '', publisher: '', genre: '', status: '읽고 싶음', is_favorite: 0, reread_count: 0 };
const GENRE_LIST = ['소설', '시/에세이', '자기계발', '경제/경영', '역사', '인문/사회', '과학/기술', '예술/문화', '철학', '여행', '어린이/청소년', '만화'];

export default function AddBookModal({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleStatusChange = (e) => {
    const s = e.target.value;
    const isDone = s === '완독';
    setForm((f) => ({
      ...f,
      status: s,
      reread_count: isDone ? Math.max(1, f.reread_count) : 0,
      is_favorite: isDone ? f.is_favorite : 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await api.createBook({ ...form, reread_count: Number(form.reread_count) });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      onClose();
    } catch (err) {
      console.error('책 추가에 실패했습니다', err);
      alert('책 추가에 실패했습니다. 서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-title">책 추가</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">제목 *</label>
            <input
              className="input"
              value={form.title}
              onChange={set('title')}
              placeholder="책 제목"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">저자</label>
            <input className="input" value={form.author} onChange={set('author')} placeholder="저자명" />
          </div>
          <div className="form-group">
            <label className="form-label">출판사</label>
            <input className="input" value={form.publisher} onChange={set('publisher')} placeholder="출판사" />
          </div>
          <div className="form-group">
            <label className="form-label">분야</label>
            <input
              className="input"
              list="genre-list"
              value={form.genre}
              onChange={set('genre')}
              placeholder="소설, 자기계발, 역사 …"
            />
            <datalist id="genre-list">
              {GENRE_LIST.map((g) => <option key={g} value={g} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label className="form-label">상태</label>
            <select className="input" value={form.status} onChange={handleStatusChange}>
              <option>읽는 중</option>
              <option>완독</option>
              <option>읽고 싶음</option>
            </select>
          </div>
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
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !form.title.trim()}>
              {loading
                ? <><span className="spinner spinner--sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> 추가 중</>
                : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
