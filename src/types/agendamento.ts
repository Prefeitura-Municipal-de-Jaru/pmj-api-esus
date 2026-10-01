export interface AgendamentoItem {
  paciente: string;
  cns: string;
  data_solicitacao: string | null;
  data_agendamento: string;
  unidade_saude: string;
  unidade_id: number;
  dias_espera: number;
}

export interface AgendamentoFilters {
  page?: number;
  limit?: number;
  search?: string;
  unidade?: string | number;
}

export interface EstatisticasFila {
  total_aguardando: string;
  media_dias_espera: string;
}
