require('dotenv').config();

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { initDb } = require('./db');
const requireAuth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3002;

app.set('trust proxy', 1);
app.use(compression());
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(o => o.length > 0);
app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : false }));
app.use(express.json());

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/books',       requireAuth, require('./routes/books'));
app.use('/api/quotes',      requireAuth, require('./routes/quotes'));
app.use('/api/stats',       requireAuth, require('./routes/stats'));
app.use('/api/collections', requireAuth, require('./routes/collections'));

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: '서버 오류가 발생했습니다' });
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Marge 서버 실행 중 → http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  start().catch(console.error);
}

module.exports = app;
