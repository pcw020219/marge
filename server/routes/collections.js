'use strict';
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.created_at, COUNT(bc.book_id)::int AS book_count
       FROM collections c
       LEFT JOIN book_collections bc ON c.id = bc.collection_id
       WHERE c.user_id=$1
       GROUP BY c.id ORDER BY c.name`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const name = req.body?.name?.trim();
    if (!name) return res.status(400).json({ error: '컬렉션 이름은 필수입니다' });

    const result = await pool.query(
      `INSERT INTO collections (user_id, name) VALUES ($1,$2)
       ON CONFLICT (user_id, name) DO NOTHING
       RETURNING *`,
      [req.userId, name]
    );
    if (result.rows.length === 0) {
      return res.status(409).json({ error: '이미 존재하는 컬렉션 이름입니다' });
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM collections WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: '컬렉션을 찾을 수 없습니다' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// 특정 책이 속한 컬렉션 목록 — /:id 앞에 정의
router.get('/book/:bookId', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name FROM collections c
       INNER JOIN book_collections bc ON c.id = bc.collection_id
       WHERE bc.book_id=$1 AND c.user_id=$2
       ORDER BY c.name`,
      [req.params.bookId, req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/books', async (req, res, next) => {
  try {
    const { book_id } = req.body;
    if (!book_id) return res.status(400).json({ error: 'book_id는 필수입니다' });

    const [colCheck, bookCheck] = await Promise.all([
      pool.query('SELECT id FROM collections WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]),
      pool.query('SELECT id, status FROM books WHERE id=$1 AND user_id=$2', [book_id, req.userId]),
    ]);
    if (!colCheck.rows[0] || !bookCheck.rows[0]) {
      return res.status(403).json({ error: '권한이 없습니다' });
    }
    if (bookCheck.rows[0].status !== '완독') {
      return res.status(400).json({ error: '완독한 책만 컬렉션에 추가할 수 있습니다' });
    }

    await pool.query(
      'INSERT INTO book_collections (book_id, collection_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [book_id, req.params.id]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/books/:bookId', async (req, res, next) => {
  try {
    const colCheck = await pool.query(
      'SELECT id FROM collections WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (!colCheck.rows[0]) return res.status(403).json({ error: '권한이 없습니다' });

    const result = await pool.query(
      'DELETE FROM book_collections WHERE collection_id=$1 AND book_id=$2',
      [req.params.id, req.params.bookId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: '해당 책을 컬렉션에서 찾을 수 없습니다' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
