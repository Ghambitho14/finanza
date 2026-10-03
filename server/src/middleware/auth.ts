import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const DEV_SECRET = 'dev-secret-change-me'
// Valores públicos (repo / .env.example): con ellos cualquiera puede firmar tokens.
const INSECURE_SECRETS = new Set([DEV_SECRET, 'cambia-este-secreto-largo-y-aleatorio'])

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (secret && !INSECURE_SECRETS.has(secret)) return secret

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[auth] JWT_SECRET no está definido o usa el valor de ejemplo. ' +
      'Genera uno largo y aleatorio (ej: openssl rand -hex 32).',
    )
  }
  console.warn('[auth] JWT_SECRET inseguro o ausente: usando secreto de desarrollo')
  return secret || DEV_SECRET
}

const JWT_SECRET = resolveJwtSecret()

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
