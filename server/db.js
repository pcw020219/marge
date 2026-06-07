const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'marge.db'));

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -8000'); // 8 MB page cache

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT,
    publisher TEXT,
    genre TEXT,
    status TEXT NOT NULL DEFAULT '읽고 싶음',
    rating REAL,
    review TEXT,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    page INTEGER,
    memo TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS book_collections (
    book_id INTEGER NOT NULL,
    collection_id INTEGER NOT NULL,
    PRIMARY KEY (book_id, collection_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_books_status_created ON books(status, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_books_created ON books(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_books_status_end   ON books(status, end_date);
  CREATE INDEX IF NOT EXISTS idx_books_status_genre ON books(status, genre);
  CREATE INDEX IF NOT EXISTS idx_quotes_book_id_created ON quotes(book_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_book_collections_book ON book_collections(book_id);
  CREATE INDEX IF NOT EXISTS idx_book_collections_col  ON book_collections(collection_id);
`);

// Migrations for existing databases
try { db.exec('ALTER TABLE books ADD COLUMN genre TEXT'); } catch (_) {}
try { db.exec('ALTER TABLE books ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0'); } catch (_) {}
try { db.exec('ALTER TABLE books ADD COLUMN reread_count INTEGER NOT NULL DEFAULT 1'); } catch (_) {}

module.exports = db;
