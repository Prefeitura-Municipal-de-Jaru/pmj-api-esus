import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import apiRouter from './routes/index.js';

export function createApp(): Express {
  const app = express();

  // Permite extracao correta de IP atras de proxies reversos (Nginx, Traefik, etc.)
  app.set('trust proxy', 1);

  // Cabecalhos de seguranca HTTP
  app.use(helmet());

  // Configuracao do CORS
  const corsOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Origem nao permitida pelas regras de CORS'));
        }
      },
      methods: ['GET', 'HEAD', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    })
  );

  // Limitador de requisicoes
  app.use('/api', apiRateLimiter);

  // Interpretacao de corpo JSON
  app.use(express.json());

  // Registro de requisicoes (sem emojis)
  app.use(requestLogger);

  // Rotas da API
  app.use('/api', apiRouter);

  // Rota de informacoes e creditos na raiz da aplicacao
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'API Fila de Espera UBS - e-SUS PEC',
      author: 'Daniel Beling',
      organization: 'Prefeitura Municipal de Jaru - RO (DTI)',
      status: 'active',
      license: 'MIT (com preservacao obrigatoria dos creditos)',
      docs: 'Consulte /api/health ou README.md',
    });
  });

  // Tratamento de rotas nao encontradas (404)
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint nao encontrado',
    });
  });

  // Middleware global de tratamento de erros
  app.use(errorHandler);

  return app;
}
