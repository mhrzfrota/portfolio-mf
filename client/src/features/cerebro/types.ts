/** Uma nota como o app enxerga: sem o corpo, que fica no banco para uso futuro. */
export interface NotaCerebro {
  path: string;
  pasta: string;
  titulo: string;
  tags: string[];
  status: string | null;
  links: string[];
  palavras: number;
  tokens: number;
  resumo: string | null;
  /** ISO da última modificação do arquivo no vault. */
  modificado: string;
}

export interface FocoCerebro {
  semana: string | null;
  texto: string;
}

export interface SyncCerebro {
  executado_em: string;
  notas: number;
  tokens: number;
  duracao_ms: number;
  foco: FocoCerebro | null;
}

export interface DadosCerebro {
  notas: NotaCerebro[];
  sync: SyncCerebro | null;
}
