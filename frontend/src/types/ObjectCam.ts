type Sensor = {
  id: number;
  title: string;
  data: string[];
};

type Localizacao = {
  latitude: number;
  longitude: number;
};

export type Cam = {
  id: number;
  title: string;
  localizacao: Localizacao;
  sensores: Sensor[];
};
