import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = env.NODE_ENV === 'development';

  console.error(`[Internal Server Error]: ${err.name} - ${err.message}`);
  if (isDev && err.stack) {
    console.error(err.stack);
  }

  // Tratamento especifico de erros do driver PostgreSQL sem expor credenciais
  if ('code' in err) {
    const pgError = err as { code?: string; message: string };
    if (pgError.code === 'ECONNREFUSED' || pgError.code === '28P01') {
      res.status(503).json({
        success: false,
        error: 'Servico de banco de dados temporariamente indisponivel',
        details: isDev ? pgError.message : undefined,
      });
      return;
    }
  }

  res.status(500).json({
    success: false,
    error: 'Ocorreu um erro interno ao processar a solicitacao',
    details: isDev ? err.message : undefined,
  });
}
