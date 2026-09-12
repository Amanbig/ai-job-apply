import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { AuthRequest, requireAuth } from '../middleware/auth.middleware.js';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_ai_job_tracker_jwt_secret_2026';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

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

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(201).json({ user, token });
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

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Demo Login (Instant 1-Click access for evaluators)
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

    const token = jwt.sign({ userId: demoUser.id, email: demoUser.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({
      user: { id: demoUser.id, email: demoUser.email, name: demoUser.name },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logout (Clears HTTP-only cookie)
authRouter.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Signed out successfully' });
});

// Current user profile
authRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  res.json({ user: req.user });
});
