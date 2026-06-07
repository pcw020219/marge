const express = require('express');
const router = express.Router();
const db = require('../db');

// 5 statements — yearlyCompleted and totalBooks are derived in JS
const stmts = {
  statusCounts: db.prepare('SELECT status, COUNT(*) AS count FROM books GROUP BY status'),
  // single scan for both yearlyCompleted and monthlyCounts
  monthlyCounts: db.prepare(`
    SELECT strftime('%Y', end_date) AS year, strftime('%m', end_date) AS month, COUNT(*) AS count
    FROM books
    WHERE status = '완독' AND end_date IS NOT NULL
    GROUP BY year, month
    ORDER BY year ASC, month ASC
  `),
  genreCounts: db.prepare(`
    SELECT TRIM(genre) AS genre, COUNT(*) AS count
    FROM books
    WHERE status = '완독' AND genre IS NOT NULL AND TRIM(genre) != ''
    GROUP BY TRIM(genre)
    ORDER BY count DESC
  `),
  avgRating:   db.prepare('SELECT AVG(rating) AS avg FROM books WHERE rating IS NOT NULL'),
  totalQuotes: db.prepare('SELECT COUNT(*) AS count FROM quotes'),
};

const readAll = db.transaction(() => {
  const statusCounts  = stmts.statusCounts.all();
  const monthlyCounts = stmts.monthlyCounts.all();
  const genreCounts   = stmts.genreCounts.all();
  const { avg }       = stmts.avgRating.get();
  const totalQuotes   = stmts.totalQuotes.get().count;

  // derive totalBooks and yearlyCompleted from already-fetched data
  const totalBooks = statusCounts.reduce((s, r) => s + r.count, 0);

  const yearMap = {};
  for (const r of monthlyCounts) yearMap[r.year] = (yearMap[r.year] ?? 0) + r.count;
  const yearlyCompleted = Object.entries(yearMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, count]) => ({ year, count }));

  return {
    statusCounts,
    yearlyCompleted,
    monthlyCounts,
    genreCounts,
    avgRating:   avg ? Math.round(avg * 10) / 10 : null,
    totalQuotes,
    totalBooks,
  };
});

router.get('/', (req, res) => {
  res.json(readAll());
});

module.exports = router;
