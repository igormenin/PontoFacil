import { Router } from 'express';
import * as clienteController from './cliente.controller.js';
import { validate } from '../../middlewares/validate.js';
import { auth } from '../../middlewares/auth.js';
import { clienteSchema, updateClienteSchema } from './cliente.schema.js';

const router = Router();

router.use(auth); // Protect all cliente routes

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: Gerenciamento de clientes
 */

/**
 * @swagger
 * /cliente:
 *   get:
 *     summary: Lista todos os clientes
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes retornada com sucesso
 *   post:
 *     summary: Cria um novo cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cliNome]
 *             properties:
 *               cliNome:
 *                 type: string
 *               cliAtivo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 */
router.get('/', clienteController.getAll);
router.post('/', validate(clienteSchema), clienteController.create);

/**
 * @swagger
 * /cliente/{id}:
 *   put:
 *     summary: Atualiza um cliente existente
 *     tags: [Clientes]
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
 *               cliNome:
 *                 type: string
 *               cliAtivo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *   delete:
 *     summary: Remove um cliente
 *     tags: [Clientes]
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
 *         description: Cliente removido com sucesso
 */
router.put('/:id', validate(updateClienteSchema), clienteController.update);
router.delete('/:id', clienteController.remove);

export default router;
