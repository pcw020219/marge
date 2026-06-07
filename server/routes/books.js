const express = require('express');
const router = express.Router();
const db = require('../db');

// Prepared statements compiled once at startup
const stmts = {
  list:         db.prepare('SELECT * FROM books ORDER BY created_at DESC'),
  listStatus:   db.prepare('SELECT * FROM books WHERE status = ? ORDER BY created_at DESC'),
  listSearch:   db.prepare('SELECT * FROM books WHERE (title LIKE ? OR author LIKE ?) ORDER BY created_at DESC'),
  listBoth:     db.prepare('SELECT * FROM books WHERE status = ? AND (title LIKE ? OR author LIKE ?) ORDER BY created_at DESC'),
  get:          db.prepare('SELECT * FROM books WHERE id = ?'),
  insert:       db.prepare('INSERT INTO books (title, author, publisher, genre, status, rating, review, start_date, end_date, is_favorite, reread_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  update:       db.prepare('UPDATE books SET title = ?, author = ?, publisher = ?, genre = ?, status = ?, rating = ?, review = ?, start_date = ?, end_date = ?, is_favorite = ?, reread_count = ? WHERE id = ?'),
  del:          db.prepare('DELETE FROM books WHERE id = ?'),
};

router.get('/', (req, res) => {
  const { status, search } = req.query;
  const like = search ? `%${search}%` : null;

  let rows;
  if (status && like)      rows = stmts.listBoth.all(status, like, like);
  else if (status)         rows = stmts.listStatus.all(status);
  else if (like)           rows = stmts.listSearch.all(like, like);
  else                     rows = stmts.list.all();

  res.json(rows);
});

router.get('/:id', (req, res) => {
  const book = stmts.get.get(req.params.id);
  if (!book) return res.status(404).json({ error: '책을 찾을 수 없습니다' });
  res.json(book);
});

router.post('/', (req, res) => {
  const { title, author, publisher, genre, status, rating, review, start_date, end_date, is_favorite, reread_count } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: '제목은 필수입니다' });

  const result = stmts.insert.run(
    title.trim(),
    author || null,
    publisher || null,
    genre || null,
    status || '읽고 싶음',
    rating ?? null,
    review || null,
    start_date || null,
    end_date || null,
    is_favorite ? 1 : 0,
    reread_count ?? 0,
  );

  res.status(201).json(stmts.get.get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const book = stmts.get.get(req.params.id);
  if (!book) return res.status(404).json({ error: '책을 찾을 수 없습니다' });

  const { title, author, publisher, genre, status, rating, review, start_date, end_date, is_favorite, reread_count } = req.body;

  const next = {
    title:        title ?? book.title,
    author:       author !== undefined ? (author || null) : book.author,
    publisher:    publisher !== undefined ? (publisher || null) : book.publisher,
    genre:        genre !== undefined ? (genre || null) : book.genre,
    status:       status ?? book.status,
    rating:       rating !== undefined ? (rating ?? null) : book.rating,
    review:       review !== undefined ? (review || null) : book.review,
    start_date:   start_date !== undefined ? (start_date || null) : book.start_date,
    end_date:     end_date !== undefined ? (end_date || null) : book.end_date,
    is_favorite:  is_favorite !== undefined ? (is_favorite ? 1 : 0) : book.is_favorite,
    reread_count: reread_count !== undefined ? Number(reread_count) : book.reread_count,
  };

  stmts.update.run(
    next.title, next.author, next.publisher, next.genre, next.status,
    next.rating, next.review, next.start_date, next.end_date,
    next.is_favorite, next.reread_count,
    req.params.id,
  );

  res.json({ ...book, ...next });
});

router.delete('/:id', (req, res) => {
  const result = stmts.del.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '책을 찾을 수 없습니다' });
  res.json({ success: true });
});

module.exports = router;
