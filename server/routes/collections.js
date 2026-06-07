'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db');

const stmts = {
  getAll: db.prepare(`
    SELECT c.id, c.name, c.created_at, COUNT(bc.book_id) AS book_count
    FROM collections c
    LEFT JOIN book_collections bc ON c.id = bc.collection_id
    GROUP BY c.id ORDER BY c.name
  `),
  getOne:     db.prepare('SELECT * FROM collections WHERE id = ?'),
  getByBook:  db.prepare(`
    SELECT c.id, c.name FROM collections c
    INNER JOIN book_collections bc ON c.id = bc.collection_id
    WHERE bc.book_id = ? ORDER BY c.name
  `),
  insert:     db.prepare('INSERT INTO collections (name) VALUES (?)'),
  delete:     db.prepare('DELETE FROM collections WHERE id = ?'),
  addBook:    db.prepare('INSERT OR IGNORE INTO book_collections (book_id, collection_id) VALUES (?, ?)'),
  removeBook: db.prepare('DELETE FROM book_collections WHERE collection_id = ? AND book_id = ?'),
};

router.get('/', (_req, res) => res.json(stmts.getAll.all()));

router.post('/', (req, res) => {
  const name = req.body?.name?.trim();
  if (!name) return res.status(400).json({ error: '컬렉션 이름은 필수입니다' });
  try {
    const result = stmts.insert.run(name);
    res.status(201).json(stmts.getOne.get(result.lastInsertRowid));
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: '이미 존재하는 컬렉션 이름입니다' });
    throw e;
  }
});

router.delete('/:id', (req, res) => {
  const result = stmts.delete.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '컬렉션을 찾을 수 없습니다' });
  res.json({ success: true });
});

// 특정 책이 속한 컬렉션 목록 — /:id 보다 앞에 정의해야 라우팅 충돌 없음
router.get('/book/:bookId', (req, res) => res.json(stmts.getByBook.all(req.params.bookId)));

router.post('/:id/books', (req, res) => {
  const { book_id } = req.body;
  if (!book_id) return res.status(400).json({ error: 'book_id는 필수입니다' });
  stmts.addBook.run(book_id, req.params.id);
  res.status(201).json({ success: true });
});

router.delete('/:id/books/:bookId', (req, res) => {
  const result = stmts.removeBook.run(req.params.id, req.params.bookId);
  if (result.changes === 0) return res.status(404).json({ error: '해당 책을 컬렉션에서 찾을 수 없습니다' });
  res.json({ success: true });
});

module.exports = router;
