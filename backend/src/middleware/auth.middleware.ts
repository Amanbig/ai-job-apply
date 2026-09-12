import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_ai_job_tracker_jwt_secret_2026';

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined;

  // 1. Prefer secure HTTP-only cookie (web browser sessions)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fall back to Authorization Bearer header (CLI, curl, evaluation test scripts)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized: Authentication required. Please sign in or provide a valid authorization token.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User associated with token no longer exists.' });
      return;
    }

    req.user = user;
    return next();
  } catch (err: any) {
    res.status(401).json({
      error: 'Unauthorized: Invalid or expired authentication token.',
      details: err.message,
    });
    return;
  }
}
