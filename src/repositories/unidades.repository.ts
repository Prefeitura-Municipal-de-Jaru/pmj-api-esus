import { pool } from '../config/database.js';
import { env } from '../config/env.js';
import { UnidadeSaude } from '../types/unidade.js';

export class UnidadesRepository {
  async findAll(): Promise<UnidadeSaude[]> {
    let query = `
      SELECT 
        co_seq_unidade_saude AS id,
        no_unidade_saude AS nome
      FROM tb_unidade_saude
    `;
    const params: number[][] = [];

    if (env.UNIDADES_IDS.length > 0) {
      query += ` WHERE co_seq_unidade_saude = ANY($1)`;
      params.push(env.UNIDADES_IDS);
    }

    query += ` ORDER BY no_unidade_saude ASC`;

    const result = await pool.query(query, params);
    return result.rows.map((row) => ({
      id: Number(row.id),
      nome: row.nome || 'Unidade sem nome',
    }));
  }
}
