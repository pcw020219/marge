import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import StarRating from './StarRating';

const STATUSES = ['읽는 중', '완독', '읽고 싶음'];

export default function BookEditModal({ book, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title:        book.title,
    author:       book.author ?? '',
    publisher:    book.publisher ?? '',
    status:       book.status,
    rating:       book.rating ?? null,
    review:       book.review ?? '',
    start_date:   book.start_date ?? '',
    end_date:     book.end_date ?? '',
    is_favorite:  book.status === '완독' ? (book.is_favorite ?? 0) : 0,
    reread_count: book.status === '완독' ? (book.reread_count ?? 1) : 0,
  });
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      await api.updateBook(book.id, {
        ...form,
        rating:       form.rating ?? null,
        review:       form.review || null,
        start_date:   form.start_date || null,
        end_date:     form.end_date || null,
        is_favorite:  form.is_favorite ? 1 : 0,
        reread_count: Number(form.reread_count),
      });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', String(book.id)] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      onClose();
    } catch (err) {
      console.error('수정 실패', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-edit-book">
        <div className="modal-title">책 수정</div>
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
          <div className="edit-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">상태</label>
              <select className="input" value={form.status} onChange={handleStatusChange}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">별점</label>
              <div style={{ paddingTop: '0.35rem' }}>
                <StarRating
                  value={form.rating}
                  onChange={(v) => setForm((f) => ({ ...f, rating: v }))}
                />
              </div>
            </div>
          </div>
          <div className="edit-grid" style={{ marginTop: '1rem' }}>
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
          <div className="edit-grid" style={{ marginTop: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">시작일</label>
              <input type="date" className="input" value={form.start_date} onChange={set('start_date')} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">완독일</label>
              <input type="date" className="input" value={form.end_date} onChange={set('end_date')} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">감상</label>
            <textarea
              className="input"
              value={form.review}
              onChange={set('review')}
              placeholder="이 책에 대한 생각을 자유롭게 적어보세요"
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !form.title.trim()}>
              {saving
                ? <><span className="spinner spinner--sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> 저장 중</>
                : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
