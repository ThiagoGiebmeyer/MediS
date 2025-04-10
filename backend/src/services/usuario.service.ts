import { Usuarios } from "../models/usuarios.model"; // Ajuste conforme sua estrutura

export const getUserByEmail = async (email: string) => {
  return await Usuarios.findOne({ where: { email } });
};
