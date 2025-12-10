import { Router } from "express";
import { createTotem, getConfig } from "../controllers/totens.controller";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /api/totem:
 *   post:
 *     summary: Criar novo totem de monitoramento
 *     tags:
 *       - Totens
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Totem Soja 01
 *               localizacao:
 *                 type: string
 *                 example: Campo A
 *               ativo:
 *                 type: boolean
 *                 example: true
 *             required:
 *               - nome
 *               - localizacao
 *     responses:
 *       201:
 *         description: Totem criado com sucesso
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
 *                       _id:
 *                         type: string
 *                       nome:
 *                         type: string
 *                       localizacao:
 *                         type: string
 *                       ativo:
 *                         type: boolean
 *       400:
 *         description: Inconsistência ao criar totem
 *       401:
 *         description: Não autorizado - token não fornecido ou inválido
 *       500:
 *         description: Inconsistência interna no servidor
 */
router.post("/", createTotem);
router.get("/config", getConfig);

export default router;
