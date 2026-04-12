import { Router } from 'express';
import * as diaController from './dia.controller.js';
import { validate } from '../../middlewares/validate.js';
import { auth } from '../../middlewares/auth.js';
import { updateDiaSchema, getDiaSchema } from './dia.schema.js';

const router = Router();

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Dias
 *   description: Lançamentos e detalhes dos dias
 */

/**
 * @swagger
 * /dia/{anoMes}:
 *   get:
 *     summary: Lista todos os dias de um mês específico com seus intervalos
 *     tags: [Dias]
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
 *         description: Dias carregados com sucesso
 */
router.get('/:anoMes', validate(getDiaSchema), diaController.getByMonth);

/**
 * @swagger
 * /dia/{data}:
 *   put:
 *     summary: Atualiza observação ou tipo de um dia específico
 *     tags: [Dias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: data
 *         required: true
 *         schema:
 *           type: string
 *         example: '2026-04-15'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               diaTipo:
 *                 type: string
 *               diaObservacao:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dia atualizado com sucesso
 */
router.put('/:data', validate(updateDiaSchema), diaController.update);

export default router;
