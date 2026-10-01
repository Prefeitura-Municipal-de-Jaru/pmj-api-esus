import { Router } from 'express';
import { UnidadesController } from '../controllers/unidades.controller.js';

const router = Router();
const controller = new UnidadesController();

router.get('/', controller.getUnidades);

export default router;
