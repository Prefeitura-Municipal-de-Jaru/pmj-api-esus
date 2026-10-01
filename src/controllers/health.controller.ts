import { Request, Response, NextFunction } from 'express';
import { checkDatabaseConnection } from '../config/database.js';

export class HealthController {
  check = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isDbConnected = await checkDatabaseConnection();
      if (!isDbConnected) {
        res.status(503).json({
          status: 'error',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}
