import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express'

/**
 * Express 4 no captura los rechazos de handlers async: sin esto, cualquier
 * error de base de datos tumba el proceso completo.
 */
export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Req, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next)
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 500
    ? err.status
    : 500

  if (status === 500) {
    console.error('[api] error no controlado', err)
  }

  if (res.headersSent) return

  const message = err?.type === 'entity.parse.failed'
    ? 'JSON inválido'
    : status === 500 ? 'Error interno del servidor' : 'Solicitud inválida'

  res.status(status).json({ error: message })
}
