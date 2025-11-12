import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt";
import { Usuario } from "../database/models/usuarios.model";
import { getUserByEmail } from "../services/usuario.service";

export const login = async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      error: true,
      messageError: "Email e senha são obrigatórios.",
      data: []
    });
  }

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: true,
        messageError: "Usuário não encontrado.",
        data: []
      });
    }

    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: true,
        messageError: "Senha inválida.",
        data: []
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      jwtConfig.secret,
      { expiresIn: typeof jwtConfig.expiresIn === "string" ? jwtConfig.expiresIn : String(jwtConfig.expiresIn) }
    );

    res.status(200).json({
      error: false,
      messageError: "",
      data: [{
        message: "Login realizado com sucesso!",
        user: {
          id: user._id,
          firstName: user.nome,
          email: user.email,
        },
        token,
      }]
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({
      error: true,
      messageError: "Erro interno no servidor.",
      data: []
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { nome, sobrenome, email, senha } = req.body;

    if (!nome || !sobrenome || !email || !senha) {
      return res.status(400).json({
        error: true,
        messageError: "Todos os campos são obrigatórios: nome, sobrenome, email e senha.",
        data: []
      });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: true,
        messageError: "E-mail já está cadastrado.",
        data: []
      });
    }

    const passwordHash = await bcrypt.hash(senha, 10);

    const newUser = await Usuario.create({
      nome,
      sobrenome,
      email,
      senha: passwordHash,
    });

    res.status(201).json({
      error: false,
      messageError: "",
      data: [{
        message: "Usuário cadastrado com sucesso!",
        user: {
          id: newUser._id,
          firstName: newUser.nome,
          lastName: newUser.sobrenome,
          email: newUser.email,
        }
      }]
    });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    res.status(500).json({
      error: true,
      messageError: "Erro interno no servidor.",
      data: []
    });
  }
};
