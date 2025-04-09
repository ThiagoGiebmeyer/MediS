import { Request, Response } from "express";
import Usuario from "../models/usuario.model";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // const user = await getUserByEmail(email);
  // if (!user) return res.status(401).json({ message: "Usuário não encontrado" });

  // const isPasswordValid = await bcrypt.compare(password, user.password);
  // if (!isPasswordValid)
  //   return res.status(401).json({ message: "Senha inválida" });

  // const token = jwt.sign({ userId: user.id }, jwtConfig.secret, {
  //   expiresIn: jwtConfig.expiresIn,
  // });

  res.json({ data: "AAA" });
};

export const criarUsuario = async (req: Request, res: Response) => {
  try {
    const usuario = await Usuario.create(req.body);
    res.status(201).json(usuario);
  } catch (error) {
    res.status(400).json({ error });
  }
};
