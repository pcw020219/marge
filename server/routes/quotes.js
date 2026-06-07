const express = require('express');
const router = express.Router();
const db = require('../db');

const WITH_BOOK = `
  SELECT q.*, b.title AS book_title, b.author AS book_author
  FROM quotes q
  LEFT JOIN books b ON q.book_id = b.id
`;

// Prepared statements compiled once at startup
const stmts = {
  list:        db.prepare(`${WITH_BOOK} ORDER BY q.created_at DESC`),
  listByBook:  db.prepare(`${WITH_BOOK} WHERE q.book_id = ? ORDER BY q.created_at DESC`),
  get:         db.prepare(`${WITH_BOOK} WHERE q.id = ?`),
  insert:      db.prepare('INSERT INTO quotes (book_id, text, page, memo) VALUES (?, ?, ?, ?)'),
  update:      db.prepare('UPDATE quotes SET text = ?, page = ?, memo = ? WHERE id = ?'),
  del:         db.prepare('DELETE FROM quotes WHERE id = ?'),
};

router.get('/', (req, res) => {
  const { book_id } = req.query;
  res.json(book_id ? stmts.listByBook.all(book_id) : stmts.list.all());
});

router.post('/', (req, res) => {
  const { book_id, text, page, memo } = req.body;
  if (!book_id || !text?.trim()) {
    return res.status(400).json({ error: '책과 문장은 필수입니다' });
  }

  const result = stmts.insert.run(book_id, text.trim(), page ?? null, memo || null);
  res.status(201).json(stmts.get.get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const quote = stmts.get.get(req.params.id);
  if (!quote) return res.status(404).json({ error: '문장을 찾을 수 없습니다' });

  const { text, page, memo } = req.body;
  stmts.update.run(
    text ?? quote.text,
    page !== undefined ? (page ?? null) : quote.page,
    memo !== undefined ? (memo || null) : quote.memo,
    req.params.id,
  );

  res.json({ ...quote, text: text ?? quote.text, page: page !== undefined ? (page ?? null) : quote.page, memo: memo !== undefined ? (memo || null) : quote.memo });
});

router.delete('/:id', (req, res) => {
  const result = stmts.del.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '문장을 찾을 수 없습니다' });
  res.json({ success: true });
});

module.exports = router;
