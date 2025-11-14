import { Router } from "express";
import {
  createSensorReading,
  getAllReadings,
  getLastReading,
  getReadingStats
} from "../controllers/totens_coletas.controller";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /api/totem/reading:
 *   post:
 *     summary: Registrar nova leitura de sensor de um totem
 *     tags:
 *       - Leituras de Sensores
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totemId:
 *                 type: string
 *                 example: 64f5a3c2b8c9d1e2f3g4h5i6
 *               temperatura:
 *                 type: number
 *                 example: 25.5
 *               umidade:
 *                 type: number
 *                 example: 65.3
 *               luminosidade:
 *                 type: number
 *                 example: 850
 *               nivelAgua:
 *                 type: number
 *                 example: 45.2
 *             required:
 *               - totemId
 *               - temperatura
 *               - umidade
 *     responses:
 *       201:
 *         description: Leitura do sensor registrada com sucesso
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
 *                       totemId:
 *                         type: string
 *                       temperatura:
 *                         type: number
 *                       umidade:
 *                         type: number
 *                       luminosidade:
 *                         type: number
 *                       nivelAgua:
 *                         type: number
 *                       dataCriacao:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Erro ao registrar leitura do sensor
 *       401:
 *         description: Não autorizado - token não fornecido ou inválido
 *       500:
 *         description: Erro interno no servidor
 */

router.use(authenticateToken);

// Criar leitura
router.post("/", createSensorReading);

// Listar todas as leituras
router.get("/", getAllReadings);

// Última leitura
router.get("/last", getLastReading);

// Estatísticas
router.get("/stats", getReadingStats);

export default router;
