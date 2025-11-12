import { Usuario } from "../database/models/usuarios.model";

export const getUserByEmail = async (email: string) => {
  return await Usuario.findOne({ email });
};
