import { Request, Response, NextFunction } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { jwtConfig, TOTEM_STATIC_TOKEN } from "../config/jwt";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    res.status(401).json({ message: "Token não fornecido" });
    return;
  }

  if (String(token).includes('medis_totem_')) {
    if (token === TOTEM_STATIC_TOKEN) {
      next();
    }
  } else {
    jwt.verify(token, jwtConfig.secret, (err, decoded) => {
      if (err) {
        if (err instanceof TokenExpiredError) {
          res.status(401).json({ message: "Token expirado" });
          return;
        }

        res.status(403).json({ message: "Token inválido" });
        return;
      }

      (req as any).user = { id: (decoded as any).userId };
      next();
    });
  }
};
