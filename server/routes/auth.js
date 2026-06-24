const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const { pool } = require('../db');
const rateLimit = require('express-rate-limit');

const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

// POST /api/auth/send — 6자리 인증 코드 이메일 발송
router.post('/send', sendLimiter, async (req, res, next) => {
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

    // 기존 미사용 코드 만료 처리
    await pool.query(
      'UPDATE magic_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [user.id]
    );

    const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    // user_id 접두사로 UNIQUE 제약 충족
    const token = `${user.id}:${code}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분

    await pool.query(
      'INSERT INTO magic_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'Marge <onboarding@resend.dev>',
      to: email,
      subject: '여백(Marge) 인증 코드',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:2rem">
          <h2 style="margin-bottom:1rem;color:#1a1a2e">여백(Marge) 로그인</h2>
          <p style="color:#555;margin-bottom:1.5rem">아래 인증 코드를 입력하세요.<br>코드는 <strong>10분</strong>간 유효합니다.</p>
          <div style="display:inline-block;padding:1rem 2rem;background:#f4f0ff;border-radius:12px;letter-spacing:0.3em;font-size:2rem;font-weight:700;color:#7B5EA7">
            ${code}
          </div>
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

// POST /api/auth/verify — 코드 검증 후 JWT 발급
router.post('/verify', verifyLimiter, async (req, res, next) => {
  try {
    const email = req.body?.email?.trim().toLowerCase();
    const code  = req.body?.code?.trim();
    if (!email || !code) return res.status(400).json({ error: '이메일과 코드를 입력해주세요' });

    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: '코드가 올바르지 않습니다' });
    }
    const userId = userResult.rows[0].id;
    const token  = `${userId}:${code}`;

    const result = await pool.query(
      `SELECT id FROM magic_tokens
       WHERE user_id = $1 AND token = $2 AND used = FALSE AND expires_at > NOW()`,
      [userId, token]
    );
    if (!result.rows[0]) {
      return res.status(401).json({ error: '코드가 올바르지 않거나 만료되었습니다' });
    }

    await pool.query('UPDATE magic_tokens SET used = TRUE WHERE id = $1', [result.rows[0].id]);

    const jwtToken = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ token: jwtToken, email });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
