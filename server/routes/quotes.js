const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const WITH_BOOK = `
  SELECT q.*, b.title AS book_title, b.author AS book_author
  FROM quotes q
  LEFT JOIN books b ON q.book_id = b.id
`;

router.get('/', async (req, res, next) => {
  try {
    const { book_id } = req.query;
    let result;
    if (book_id) {
      result = await pool.query(
        `${WITH_BOOK} WHERE q.book_id=$1 AND q.user_id=$2 ORDER BY q.created_at DESC`,
        [book_id, req.userId]
      );
    } else {
      result = await pool.query(
        `${WITH_BOOK} WHERE q.user_id=$1 ORDER BY q.created_at DESC`,
        [req.userId]
      );
    }
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { book_id, text, page, memo } = req.body;
    if (!book_id || !text?.trim()) {
      return res.status(400).json({ error: '책과 문장은 필수입니다' });
    }

    const bookCheck = await pool.query(
      'SELECT id FROM books WHERE id=$1 AND user_id=$2',
      [book_id, req.userId]
    );
    if (!bookCheck.rows[0]) return res.status(403).json({ error: '권한이 없습니다' });

    const ins = await pool.query(
      'INSERT INTO quotes (user_id, book_id, text, page, memo) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [req.userId, book_id, text.trim(), page ?? null, memo || null]
    );

    const result = await pool.query(
      `${WITH_BOOK} WHERE q.id=$1`,
      [ins.rows[0].id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const quoteRes = await pool.query(
      `${WITH_BOOK} WHERE q.id=$1 AND q.user_id=$2`,
      [req.params.id, req.userId]
    );
    const quote = quoteRes.rows[0];
    if (!quote) return res.status(404).json({ error: '문장을 찾을 수 없습니다' });

    const { text, page, memo } = req.body;
    const upd = await pool.query(
      'UPDATE quotes SET text=$1, page=$2, memo=$3 WHERE id=$4 AND user_id=$5 RETURNING id',
      [
        text ?? quote.text,
        page !== undefined ? (page ?? null) : quote.page,
        memo !== undefined ? (memo || null) : quote.memo,
        req.params.id,
        req.userId,
      ]
    );

    const result = await pool.query(`${WITH_BOOK} WHERE q.id=$1`, [upd.rows[0].id]);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM quotes WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: '문장을 찾을 수 없습니다' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
