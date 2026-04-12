import { Router } from 'express';
import * as usuarioController from './usuario.controller.js';
import { auth as authenticate } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', usuarioController.getAll);
router.post('/', usuarioController.create);
router.put('/:id', usuarioController.update);
router.delete('/:id', usuarioController.remove);
router.post('/:id/reset-password', usuarioController.resetPassword);

export default router;
