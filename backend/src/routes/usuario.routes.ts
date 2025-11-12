import express from "express";
import { login, register } from "../controllers/usuarios.controller";

const router = express.Router();

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Realizar login de usuário
 *     tags:
 *       - Usuários
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               senha:
 *                 type: string
 *                 example: senha123
 *             required:
 *               - email
 *               - senha
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 messageError:
 *                   type: string
 *                   example: ""
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       message:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           email:
 *                             type: string
 *                       token:
 *                         type: string
 *       400:
 *         description: Email e senha são obrigatórios
 *       401:
 *         description: Usuário não encontrado ou senha inválida
 *       500:
 *         description: Erro interno no servidor
 */
router.post("/login", login);

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Cadastrar novo usuário
 *     tags:
 *       - Usuários
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: João
 *               sobrenome:
 *                 type: string
 *                 example: Silva
 *               email:
 *                 type: string
 *                 example: joao@example.com
 *               senha:
 *                 type: string
 *                 example: senha123
 *             required:
 *               - nome
 *               - sobrenome
 *               - email
 *               - senha
 *     responses:
 *       201:
 *         description: Usuário cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 messageError:
 *                   type: string
 *                   example: ""
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       message:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *       400:
 *         description: Campos obrigatórios faltando
 *       409:
 *         description: E-mail já está cadastrado
 *       500:
 *         description: Erro interno no servidor
 */
router.post("/register", register);

export default router;
