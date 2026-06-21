const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const uid = req.userId;
    let result;

    if (status && search) {
      const like = `%${search}%`;
      result = await pool.query(
        'SELECT * FROM books WHERE user_id=$1 AND status=$2 AND (title ILIKE $3 OR author ILIKE $3) ORDER BY created_at DESC',
        [uid, status, like]
      );
    } else if (status) {
      result = await pool.query(
        'SELECT * FROM books WHERE user_id=$1 AND status=$2 ORDER BY created_at DESC',
        [uid, status]
      );
    } else if (search) {
      const like = `%${search}%`;
      result = await pool.query(
        'SELECT * FROM books WHERE user_id=$1 AND (title ILIKE $2 OR author ILIKE $2) ORDER BY created_at DESC',
        [uid, like]
      );
    } else {
      result = await pool.query(
        'SELECT * FROM books WHERE user_id=$1 ORDER BY created_at DESC',
        [uid]
      );
    }

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM books WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: '책을 찾을 수 없습니다' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, author, publisher, genre, status, rating, review, start_date, end_date, is_favorite, reread_count } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: '제목은 필수입니다' });

    const result = await pool.query(
      `INSERT INTO books (user_id, title, author, publisher, genre, status, rating, review, start_date, end_date, is_favorite, reread_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        req.userId,
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
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const bookRes = await pool.query(
      'SELECT * FROM books WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    const book = bookRes.rows[0];
    if (!book) return res.status(404).json({ error: '책을 찾을 수 없습니다' });

    const { title, author, publisher, genre, status, rating, review, start_date, end_date, is_favorite, reread_count } = req.body;

    const v = {
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

    const result = await pool.query(
      `UPDATE books
       SET title=$1, author=$2, publisher=$3, genre=$4, status=$5, rating=$6,
           review=$7, start_date=$8, end_date=$9, is_favorite=$10, reread_count=$11
       WHERE id=$12 AND user_id=$13
       RETURNING *`,
      [v.title, v.author, v.publisher, v.genre, v.status, v.rating,
       v.review, v.start_date, v.end_date, v.is_favorite, v.reread_count,
       req.params.id, req.userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM books WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: '책을 찾을 수 없습니다' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
