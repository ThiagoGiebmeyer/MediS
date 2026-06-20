export interface NewTotemDTO {
  nome: string;
  latitude: string;
  longitude: string;
  intervalo_coleta: number;
  _id?: string;
}

export interface Totem {
  _id: string;
  nome: string;
  latitude: string;
  longitude: string;
  intervalo_coleta: number;
  usuario_id?: string;
  criado_em?: string;
  alterado_em?: string;
}

export type TotemList = Totem[];
