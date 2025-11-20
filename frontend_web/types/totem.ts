
export interface NewTotemDTO {
  nome: string;
  latitude: string;
  longitude: string;
  intervalo_coleta: number;
}

export interface Totem {
  _id: string;
  nome: string;
  latitude: string;
  longitude: string;
  intervalo_coleta: number;
  createdAt: string;
  updatedAt: string;
}
