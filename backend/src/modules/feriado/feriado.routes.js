import { Router } from 'express';
import * as feriadoController from './feriado.controller.js';
import { validate } from '../../middlewares/validate.js';
import { auth } from '../../middlewares/auth.js';
import { feriadoSchema, updateFeriadoSchema } from './feriado.schema.js';

const router = Router();

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Feriados
 *   description: Cadastro de feriados (Nacionais, Estaduais e Municipais)
 */

/**
 * @swagger
 * /feriado:
 *   get:
 *     summary: Lista todos os feriados cadastrados
 *     tags: [Feriados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de feriados retornada com sucesso
 *   post:
 *     summary: Cadastra um novo feriado ou atualiza se já existir (upsert)
 *     tags: [Feriados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ferData, ferNome]
 *             properties:
 *               ferData:
 *                 type: string
 *                 example: '2026-05-01'
 *               ferNome:
 *                 type: string
 *               ferTipo:
 *                 type: string
 *                 enum: [NACIONAL, ESTADUAL, MUNICIPAL, FACULTATIVO]
 *     responses:
 *       201:
 *         description: Feriado cadastrado com sucesso
 */
router.get('/', feriadoController.getAll);
router.post('/', validate(feriadoSchema), feriadoController.create);

/**
 * @swagger
 * /feriado/{id}:
 *   delete:
 *     summary: Remove um feriado
 *     tags: [Feriados]
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
 *         description: Feriado removido com sucesso
 */
router.delete('/:id', feriadoController.remove);

export default router;
