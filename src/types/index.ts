export interface Processo {
  processo_id: number;
  cliente_id: number;
  numero_processo: string;
  area: string;
  tipo: string;
  responsavel: string;
  etapa_atual: string;
  prob_sucesso: number;
  valor_causa: number;
  data_abertura: string;
}

export interface KpisExecutivos {
  totalProcessos: number;
  processosAtivos: number;
  valorTotalCarteira: number;
  pipelinePonderado: number;
  totalRecebido: number;
  totalPendente: number;
}

export interface MetricaArea {
  area: string;
  total: number;
  valor: number;
}