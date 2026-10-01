import { Request, Response, NextFunction } from 'express';
import { UnidadesService } from '../services/unidades.service.js';

export class UnidadesController {
  constructor(private readonly service = new UnidadesService()) {}

  getUnidades = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const unidades = await this.service.getUnidades();
      res.status(200).json(unidades);
    } catch (error) {
      next(error);
    }
  };
}
