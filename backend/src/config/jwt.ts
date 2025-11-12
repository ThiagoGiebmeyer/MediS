import { Secret } from "jsonwebtoken";

export const jwtConfig: { secret: Secret; expiresIn: string | number } = {
  secret: process.env.API_SECRET || "sua_chave_secreta",
  expiresIn: "1h",
};