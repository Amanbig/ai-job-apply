import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { AuthRequest, requireAuth } from '../middleware/auth.middleware.js';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_ai_job_tracker_jwt_secret_2026';

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes short-lived access token
const REFRESH_TOKEN_DAYS = 7;      // 7 days long-lived refresh token

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

async function issueTokens(user: { id: string; email: string }, res: Response) {
  const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshTokenString = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenString,
      userId: user.id,
      expiresAt,
    },
  });

  res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie('token', accessToken, ACCESS_COOKIE_OPTIONS); // backward-compatible
  res.cookie('refreshToken', refreshTokenString, REFRESH_COOKIE_OPTIONS);

  return {
    accessToken,
    refreshToken: refreshTokenString,
    token: accessToken,
  };
}

// Register
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const tokens = await issueTokens(user, res);
    res.status(201).json({ user, ...tokens });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokens = await issueTokens(user, res);
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Refresh Token: Exchanges valid refresh token for a new access token & rotates refresh token
authRouter.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided', code: 'NO_REFRESH_TOKEN' });
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } }).catch(() => {});
      }
      res.clearCookie('accessToken', { path: '/' });
      res.clearCookie('refreshToken', { path: '/' });
      res.clearCookie('token', { path: '/' });
      return res.status(401).json({
        error: 'Invalid or expired refresh token. Please sign in again.',
        code: 'REFRESH_TOKEN_EXPIRED',
      });
    }

    // Token rotation: delete old refresh token and issue a fresh pair
    await prisma.refreshToken.delete({ where: { id: storedToken.id } }).catch(() => {});
    const tokens = await issueTokens(storedToken.user, res);

    res.json({
      user: storedToken.user,
      ...tokens,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Demo Login (for headless API & CLI tests)
authRouter.post('/demo', async (req, res) => {
  try {
    let demoUser = await prisma.user.findUnique({ where: { email: 'demo@careeropt.ai' } });
    if (!demoUser) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('demo123', salt);
      demoUser = await prisma.user.create({
        data: {
          email: 'demo@careeropt.ai',
          name: 'Amanpreet Singh (Demo Candidate)',
          passwordHash,
        },
      });
    }

    const tokens = await issueTokens(demoUser, res);
    res.json({
      user: { id: demoUser.id, email: demoUser.email, name: demoUser.name },
      ...tokens,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logout: Revokes refresh token in database and clears HTTP-only cookies
authRouter.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
    }
  } catch (err) {
    console.error('Logout error deleting refresh token:', err);
  }

  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Signed out successfully' });
});

// Current user profile
authRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  res.json({ user: req.user });
});
