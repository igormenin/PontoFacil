import { Router } from 'express';
import * as valorHoraController from './valorHora.controller.js';
import { validate } from '../../middlewares/validate.js';
import { auth } from '../../middlewares/auth.js';
import { valorHoraSchema, getValorHoraSchema } from './valorHora.schema.js';

const router = Router();

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Valor Hora
 *   description: Gerenciamento de valor/hora dos clientes
 */

/**
 * @swagger
 * /valor-hora:
 *   get:
 *     summary: Retorna o histórico de valor/hora de um cliente
 *     tags: [Valor Hora]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cliId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Histórico retornado com sucesso
 *   post:
 *     summary: Define um novo valor/hora para um cliente
 *     tags: [Valor Hora]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vhCliId, vhValor, vhMesInicio]
 *             properties:
 *               vhCliId:
 *                 type: integer
 *               vhValor:
 *                 type: number
 *               vhMesInicio:
 *                 type: string
 *                 example: '2026-04-01'
 *     responses:
 *       201:
 *         description: Valor/hora criado com sucesso
 */
router.get('/', validate(getValorHoraSchema), valorHoraController.getByCliente);
router.post('/', validate(valorHoraSchema), valorHoraController.create);

export default router;
