import { Router } from 'express';
import * as configuracaoController from './configuracao.controller.js';
import { auth as authenticate } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/smtp', configuracaoController.getConfig);
router.post('/smtp', configuracaoController.updateConfig);

export default router;
