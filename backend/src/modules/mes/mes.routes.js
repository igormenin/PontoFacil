import { Router } from 'express';
import * as mesController from './mes.controller.js';
import { validate } from '../../middlewares/validate.js';
import { auth } from '../../middlewares/auth.js';
import { getMesSchema } from './mes.schema.js';

const router = Router();

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Meses
 *   description: Consultas de meses e fechamentos
 */

/**
 * @swagger
 * /mes:
 *   get:
 *     summary: Lista todos os meses cadastrados no sistema
 *     tags: [Meses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de meses retornada com sucesso
 */
router.get('/', mesController.getAll);

/**
 * @swagger
 * /mes/{anoMes}:
 *   get:
 *     summary: Retorna detalhes de um mês específico
 *     tags: [Meses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: anoMes
 *         required: true
 *         schema:
 *           type: string
 *         example: '2026-04'
 *     responses:
 *       200:
 *         description: Detalhes do mês retornados com sucesso
 */
router.get('/:anoMes', validate(getMesSchema), mesController.getByAnoMes);

export default router;
