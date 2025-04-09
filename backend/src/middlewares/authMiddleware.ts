import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Token não fornecido" });
    return;
  }

  jwt.verify(token, jwtConfig.secret, (err, decoded) => {
    if (err) {
      res.status(403).json({ message: "Token inválido" });
      return;
    }

    req.body.userId = (decoded as any).userId;
    next();
  });
};
