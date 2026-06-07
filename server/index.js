const express = require('express');
const cors = require('cors');
const compression = require('compression');

const app = express();
const PORT = 3002;

app.use(compression());
app.use(cors());
app.use(express.json());

app.use('/api/books', require('./routes/books'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/collections', require('./routes/collections'));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Marge 서버 실행 중 → http://localhost:${PORT}`);
  });
}

module.exports = app;
