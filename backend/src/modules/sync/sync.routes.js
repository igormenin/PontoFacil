import { Router } from 'express';
import { push, pull } from './sync.controller.js';
import { auth } from '../../middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * /api/sync/push:
 *   post:
 *     summary: Push mutations from mobile device
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 */
router.post('/push', auth, push);

/**
 * @swagger
 * /api/sync/pull:
 *   get:
 *     summary: Pull changes from server
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 */
router.get('/pull', auth, pull);

export default router;
