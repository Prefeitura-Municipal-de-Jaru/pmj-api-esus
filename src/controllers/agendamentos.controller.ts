import { Request, Response, NextFunction } from 'express';
import { AgendamentosService } from '../services/agendamentos.service.js';

export class AgendamentosController {
  constructor(private readonly service = new AgendamentosService()) {}

  getAgendamentos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const unidade = req.query.unidade ? String(req.query.unidade) : undefined;

      const result = await this.service.getAgendamentos({
        page,
        limit,
        search,
        unidade,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getEstatisticas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const unidade = req.query.unidade ? String(req.query.unidade) : undefined;

      const stats = await this.service.getEstatisticas({
        search,
        unidade,
      });

      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  };
}
