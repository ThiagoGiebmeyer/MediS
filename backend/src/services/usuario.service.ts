import { Usuario } from "../database/models/usuarios.model";

export const getUserByEmail = async (email: string) => {
  return await Usuario.findOne({ email });
};

export const getUserById = async (id: string) => {
  return await Usuario.findById(id).select("-senha");
};
