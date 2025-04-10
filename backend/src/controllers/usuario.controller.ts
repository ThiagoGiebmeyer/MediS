import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUserByEmail } from "../services/usuario.service";
import { jwtConfig } from "../config/jwt";
import { Usuarios } from "../models/usuarios.model";

export const login = async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: "Email e senha são obrigatórios." });
  }

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado." });
    }

    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Senha inválida." });
    }

    const token = jwt.sign({ userId: user.id }, jwtConfig.secret);

    res.status(200).json({
      message: "Login realizado com sucesso!",
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
};

export const cadastro = async (req: Request, res: Response) => {
  try {
    const { nome, sobrenome, email, senha } = req.body;

    if (!nome || !sobrenome || !email || !senha) {
      return res.status(400).json({
        message:
          "Todos os campos são obrigatórios: nome, sobrenome, email e senha.",
      });
    }

    const usuarioExistente = await getUserByEmail(email);
    if (usuarioExistente) {
      return res.status(409).json({ message: "E-mail já está cadastrado." });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const novoUsuario = await Usuarios.create({
      nome,
      sobrenome,
      email,
      senha: senhaHash,
    });

    res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        sobrenome: novoUsuario.sobrenome,
        email: novoUsuario.email,
      },
    });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
};
