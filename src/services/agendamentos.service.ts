import { AgendamentosRepository } from '../repositories/agendamentos.repository.js';
import { AgendamentoFilters, AgendamentoItem, EstatisticasFila } from '../types/agendamento.js';
import { PaginatedResult } from '../types/pagination.js';

export class AgendamentosService {
  constructor(private readonly repository = new AgendamentosRepository()) {}

  async getAgendamentos(filters: AgendamentoFilters): Promise<PaginatedResult<AgendamentoItem>> {
    const rawPage = Number(filters.page) || 1;
    const rawLimit = Number(filters.limit) || 15;

    const page = Math.max(1, rawPage);
    // Permite ate 10000 caso seja solicitacao de exportacao de relatorios
    const limit = Math.max(1, Math.min(10000, rawLimit));
    const offset = (page - 1) * limit;

    const totalItems = await this.repository.countAgendamentos(filters);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const data = await this.repository.findAgendamentos(filters, limit, offset);

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }

  async getEstatisticas(filters: AgendamentoFilters): Promise<EstatisticasFila> {
    return this.repository.findEstatisticas(filters);
  }
}
