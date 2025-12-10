import { Secret } from "jsonwebtoken";

export const jwtConfig: { secret: Secret; expiresIn: string | number } = {
  secret: process.env.API_SECRET || 'S',
  expiresIn: "1h",
};

export const TOTEM_STATIC_TOKEN = process.env.API_TOTEM_TOKEN || 'medis_totem_3952896fda05ebb26696c2ab87c08775624c0623d317cf9948fca362b48c6b1a';
