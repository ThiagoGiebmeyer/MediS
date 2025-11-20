import { Secret } from "jsonwebtoken";

export const jwtConfig: { secret: Secret; expiresIn: string | number } = {
  secret: process.env.API_SECRET || 'S',
  expiresIn: "1h",
};

export const TOTEM_STATIC_TOKEN = process.env.API_TOTEM_TOKEN;
