import { Router } from 'express';
import * as intervalController from './intervalo.controller.js';
import { validate } from '../../middlewares/validate.js';
import { auth } from '../../middlewares/auth.js';
import { intervaloSchema, updateIntervaloSchema } from './intervalo.schema.js';

const router = Router();

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Intervalos
 *   description: Lançamentos de entrada e saída (batidas)
 */

/**
 * @swagger
 * /intervalo:
 *   post:
 *     summary: Adiciona um novo intervalo de tempo em um dia
 *     tags: [Intervalos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [diaId, cliId, ordem, inicio]
 *             properties:
 *               diaId:
 *                 type: integer
 *               cliId:
 *                 type: integer
 *               ordem:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 7
 *               inicio:
 *                 type: string
 *                 example: '08:00'
 *               fim:
 *                 type: string
 *                 example: '12:00'
 *     responses:
 *       201:
 *         description: Intervalo criado com sucesso
 */
router.post('/', validate(intervaloSchema), intervalController.create);

/**
 * @swagger
 * /intervalo/{id}:
 *   put:
 *     summary: Atualiza um intervalo existente
 *     tags: [Intervalos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cliId:
 *                 type: integer
 *               ordem:
 *                 type: integer
 *               inicio:
 *                 type: string
 *               fim:
 *                 type: string
 *     responses:
 *       200:
 *         description: Intervalo atualizado com sucesso
 */
router.put('/:id', validate(updateIntervaloSchema), intervalController.update);

/**
 * @swagger
 * /intervalo/{id}:
 *   delete:
 *     summary: Remove um intervalo específico
 *     tags: [Intervalos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Intervalo removido com sucesso
 */
router.delete('/:id', intervalController.remove);

export default router;
