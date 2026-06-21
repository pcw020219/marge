const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const { pool } = require('../db');

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/auth/send — 매직 링크 이메일 발송
router.post('/send', async (req, res, next) => {
  try {
    const email = req.body?.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: '유효한 이메일을 입력해주세요' });
    }

    const userResult = await pool.query(
      `INSERT INTO users (email) VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id, email`,
      [email]
    );
    const user = userResult.rows[0];

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      'INSERT INTO magic_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    const magicLink = `${process.env.APP_URL}/verify?token=${token}`;

    await resend.emails.send({
      from: process.env.RESEND_FROM || 'Marge <onboarding@resend.dev>',
      to: email,
      subject: '여백(Marge) 로그인 링크',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:2rem">
          <h2 style="margin-bottom:1rem;color:#1a1a2e">여백(Marge) 로그인</h2>
          <p style="color:#555">아래 버튼을 클릭하여 로그인하세요.<br>링크는 <strong>15분</strong>간 유효합니다.</p>
          <a href="${magicLink}"
             style="display:inline-block;margin-top:1.5rem;padding:0.75rem 1.75rem;background:#7B5EA7;color:#fff;border-radius:8px;text-decoration:none;font-size:1rem;font-weight:600">
            로그인하기
          </a>
          <p style="margin-top:2.5rem;font-size:0.8rem;color:#aaa">
            이 이메일을 요청하지 않으셨다면 무시하세요.
          </p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/verify?token=xxx — 토큰 검증 후 JWT 발급
router.get('/verify', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: '토큰이 없습니다' });

    const result = await pool.query(
      `SELECT mt.id, mt.user_id, u.email
       FROM magic_tokens mt
       JOIN users u ON mt.user_id = u.id
       WHERE mt.token = $1 AND mt.used = FALSE AND mt.expires_at > NOW()`,
      [token]
    );

    if (!result.rows[0]) {
      return res.status(401).json({ error: '링크가 만료되었거나 유효하지 않습니다' });
    }

    const row = result.rows[0];
    await pool.query('UPDATE magic_tokens SET used = TRUE WHERE id = $1', [row.id]);

    const jwtToken = jwt.sign(
      { userId: row.user_id, email: row.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ token: jwtToken, email: row.email });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
