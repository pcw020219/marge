#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const db = require(path.join(__dirname, '..', 'db.js'));

const VALID_STATUSES = new Set(['읽고 싶음', '읽는 중', '완독']);

function validate(book, index) {
  const errors = [];

  if (!book.title || typeof book.title !== 'string' || !book.title.trim()) {
    errors.push('title 필드가 없거나 비어 있습니다');
  }

  if (book.status !== undefined && !VALID_STATUSES.has(book.status)) {
    errors.push(`status 값이 유효하지 않습니다: "${book.status}" (허용: 읽고 싶음 / 읽는 중 / 완독)`);
  }

  if (book.rating !== null && book.rating !== undefined) {
    const r = Number(book.rating);
    if (isNaN(r) || r < 1 || r > 5) {
      errors.push(`rating 값이 범위를 벗어났습니다: ${book.rating} (1~5 또는 null)`);
    }
  }

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  for (const field of ['start_date', 'end_date']) {
    const v = book[field];
    if (v !== null && v !== undefined && v !== '' && !dateRe.test(v)) {
      errors.push(`${field} 형식이 잘못됐습니다: "${v}" (YYYY-MM-DD 또는 null)`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`[항목 ${index + 1}] ${errors.join('; ')}`);
  }
}

function normalize(book) {
  return {
    title:       book.title.trim(),
    author:      book.author     ?? null,
    publisher:   book.publisher  ?? null,
    genre:       book.genre      ?? null,
    status:      book.status     ?? '읽고 싶음',
    rating:      book.rating     != null ? Number(book.rating) : null,
    review:      book.memo       ?? null,
    start_date:  book.start_date || null,
    end_date:    book.end_date   || null,
    is_favorite: book.is_favorite ? 1 : 0,
    reread_count: Number(book.reread_count ?? 1),
  };
}

function run() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('사용법: node scripts/import.js <json파일경로>');
    process.exit(1);
  }

  const absPath = path.resolve(filePath);

  if (!fs.existsSync(absPath)) {
    console.error(`파일을 찾을 수 없습니다: ${absPath}`);
    process.exit(1);
  }

  let raw;
  try {
    raw = fs.readFileSync(absPath, 'utf-8');
  } catch (e) {
    console.error(`파일 읽기 실패: ${e.message}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`JSON 파싱 실패: ${e.message}`);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error('JSON 파일의 최상위 구조가 배열이어야 합니다.');
    process.exit(1);
  }

  console.log(`총 ${data.length}개 항목을 검증 중...`);

  // Validate all before inserting anything
  for (let i = 0; i < data.length; i++) {
    try {
      validate(data[i], i);
    } catch (e) {
      console.error(`검증 실패 — ${e.message}`);
      process.exit(1);
    }
  }

  const insert = db.prepare(`
    INSERT INTO books (title, author, publisher, genre, status, rating, review,
                       start_date, end_date, is_favorite, reread_count)
    VALUES (@title, @author, @publisher, @genre, @status, @rating, @review,
            @start_date, @end_date, @is_favorite, @reread_count)
  `);

  const importAll = db.transaction((items) => {
    let inserted = 0;
    for (const item of items) {
      insert.run(normalize(item));
      inserted++;
    }
    return inserted;
  });

  try {
    const count = importAll(data);
    console.log(`완료: ${count}개 책을 DB에 삽입했습니다.`);
  } catch (e) {
    console.error(`DB 삽입 실패: ${e.message}`);
    process.exit(1);
  }
}

run();
