import { pool } from '../config/database.js';
import { env } from '../config/env.js';
import { AgendamentoItem, AgendamentoFilters, EstatisticasFila } from '../types/agendamento.js';

interface QueryConditions {
  whereClause: string;
  params: (string | number | number[])[];
}

export class AgendamentosRepository {
  private buildWhereConditions(filters: AgendamentoFilters): QueryConditions {
    const whereClauses: string[] = [
      'a.dt_agendado >= CURRENT_DATE',
      'a.st_agendado = 0',
    ];
    const params: (string | number | number[])[] = [];

    // Filtro global de unidades configurado no ambiente (se houver)
    if (env.UNIDADES_IDS.length > 0) {
      params.push(env.UNIDADES_IDS);
      whereClauses.push(`l.co_unidade_saude = ANY($${params.length})`);
    }

    // Filtro por termo de busca (Nome, Unidade ou CNS)
    if (filters.search && filters.search.trim() !== '') {
      params.push(`%${filters.search.trim()}%`);
      const searchIndex = params.length;
      whereClauses.push(`(
        c.no_cidadao ILIKE $${searchIndex} OR 
        u.no_unidade_saude ILIKE $${searchIndex} OR
        c.nu_cns ILIKE $${searchIndex}
      )`);
    }

    // Filtro por unidade específica selecionada pelo usuário
    if (filters.unidade) {
      const unidadeId = Number(filters.unidade);
      if (!Number.isNaN(unidadeId)) {
        params.push(unidadeId);
        whereClauses.push(`l.co_unidade_saude = $${params.length}`);
      }
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    return { whereClause, params };
  }

  async countAgendamentos(filters: AgendamentoFilters): Promise<number> {
    const { whereClause, params } = this.buildWhereConditions(filters);

    const query = `
      SELECT COUNT(*) AS total
      FROM tb_agendado a
      JOIN tb_prontuario pr ON a.co_prontuario = pr.co_seq_prontuario
      JOIN tb_cidadao c ON pr.co_cidadao = c.co_seq_cidadao
      LEFT JOIN tb_lotacao l ON a.co_lotacao_agendada = l.co_ator_papel
      LEFT JOIN tb_unidade_saude u ON l.co_unidade_saude = u.co_seq_unidade_saude
      ${whereClause}
    `;

    const result = await pool.query(query, params);
    return parseInt(result.rows[0]?.total || '0', 10);
  }

  async findAgendamentos(
    filters: AgendamentoFilters,
    limit: number,
    offset: number
  ): Promise<AgendamentoItem[]> {
    const { whereClause, params } = this.buildWhereConditions(filters);

    params.push(limit);
    const limitIndex = params.length;

    params.push(offset);
    const offsetIndex = params.length;

    const query = `
      SELECT
        (SELECT string_agg(upper(substring(w from 1 for 1)) || '.', ' ') 
         FROM regexp_split_to_table(c.no_cidadao, '[[:space:]]+') w) AS paciente,
        overlay(c.nu_cns placing '********' from 4 for 8) AS cns,
        COALESCE(a.dt_criacao, a.dt_agendado) AS data_solicitacao,
        a.dt_agendado AS data_agendamento,
        u.no_unidade_saude AS unidade_saude,
        u.co_seq_unidade_saude AS unidade_id,
        CAST(a.dt_agendado AS DATE) - CAST(COALESCE(a.dt_criacao, a.dt_agendado) AS DATE) AS dias_espera
      FROM tb_agendado a
      JOIN tb_prontuario pr ON a.co_prontuario = pr.co_seq_prontuario
      JOIN tb_cidadao c ON pr.co_cidadao = c.co_seq_cidadao
      LEFT JOIN tb_lotacao l ON a.co_lotacao_agendada = l.co_ator_papel
      LEFT JOIN tb_unidade_saude u ON l.co_unidade_saude = u.co_seq_unidade_saude
      ${whereClause}
      ORDER BY a.dt_agendado ASC, a.hr_inicial_agendado ASC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const result = await pool.query(query, params);
    return result.rows.map((row) => ({
      paciente: row.paciente || 'Nao identificado',
      cns: row.cns || '***',
      data_solicitacao: row.data_solicitacao ? new Date(row.data_solicitacao).toISOString() : null,
      data_agendamento: row.data_agendamento ? new Date(row.data_agendamento).toISOString() : '',
      unidade_saude: row.unidade_saude || 'Nao informada',
      unidade_id: Number(row.unidade_id) || 0,
      dias_espera: Number(row.dias_espera) || 0,
    }));
  }

  async findEstatisticas(filters: AgendamentoFilters): Promise<EstatisticasFila> {
    const { whereClause, params } = this.buildWhereConditions(filters);

    const query = `
      SELECT 
        COUNT(*) AS total_aguardando,
        ROUND(AVG(CAST(a.dt_agendado AS DATE) - CAST(COALESCE(a.dt_criacao, a.dt_agendado) AS DATE)), 0) AS media_dias_espera
      FROM tb_agendado a
      JOIN tb_prontuario pr ON a.co_prontuario = pr.co_seq_prontuario
      JOIN tb_cidadao c ON pr.co_cidadao = c.co_seq_cidadao
      LEFT JOIN tb_lotacao l ON a.co_lotacao_agendada = l.co_ator_papel
      LEFT JOIN tb_unidade_saude u ON l.co_unidade_saude = u.co_seq_unidade_saude
      ${whereClause}
    `;

    const result = await pool.query(query, params);
    const row = result.rows[0];

    return {
      total_aguardando: row?.total_aguardando ? String(row.total_aguardando) : '0',
      media_dias_espera: row?.media_dias_espera !== null && row?.media_dias_espera !== undefined ? String(row.media_dias_espera) : '0',
    };
  }
}
