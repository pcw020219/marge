const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const uid = req.userId;

    const [statusRes, monthlyRes, genreRes, avgRes, quotesRes] = await Promise.all([
      pool.query(
        'SELECT status, COUNT(*)::int AS count FROM books WHERE user_id=$1 GROUP BY status',
        [uid]
      ),
      pool.query(
        `SELECT TO_CHAR(end_date::date,'YYYY') AS year,
                TO_CHAR(end_date::date,'MM')   AS month,
                COUNT(*)::int                  AS count
         FROM books
         WHERE user_id=$1 AND status='완독' AND end_date IS NOT NULL
         GROUP BY year, month
         ORDER BY year ASC, month ASC`,
        [uid]
      ),
      pool.query(
        `SELECT TRIM(genre) AS genre, COUNT(*)::int AS count
         FROM books
         WHERE user_id=$1 AND status='완독' AND genre IS NOT NULL AND TRIM(genre) != ''
         GROUP BY TRIM(genre)
         ORDER BY count DESC`,
        [uid]
      ),
      pool.query(
        'SELECT AVG(rating) AS avg FROM books WHERE user_id=$1 AND rating IS NOT NULL',
        [uid]
      ),
      pool.query(
        'SELECT COUNT(*)::int AS count FROM quotes WHERE user_id=$1',
        [uid]
      ),
    ]);

    const statusCounts  = statusRes.rows;
    const monthlyCounts = monthlyRes.rows;
    const genreCounts   = genreRes.rows;
    const avg           = avgRes.rows[0]?.avg;
    const totalQuotes   = quotesRes.rows[0].count;
    const totalBooks    = statusCounts.reduce((s, r) => s + r.count, 0);

    const yearMap = {};
    for (const r of monthlyCounts) yearMap[r.year] = (yearMap[r.year] ?? 0) + r.count;
    const yearlyCompleted = Object.entries(yearMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([year, count]) => ({ year, count }));

    res.json({
      statusCounts,
      yearlyCompleted,
      monthlyCounts,
      genreCounts,
      avgRating:   avg != null ? Math.round(parseFloat(avg) * 10) / 10 : null,
      totalQuotes,
      totalBooks,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
