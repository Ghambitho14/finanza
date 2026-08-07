import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export interface AuthPayload {
  userId: string
  email: string
}

export interface AuthedRequest extends Request {
  auth?: AuthPayload
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autenticado' })
    return
  }

  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload
    req.auth = { userId: decoded.userId, email: decoded.email }
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}
