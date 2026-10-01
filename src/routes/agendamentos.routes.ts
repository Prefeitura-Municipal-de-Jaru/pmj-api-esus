import { Router } from 'express';
import { AgendamentosController } from '../controllers/agendamentos.controller.js';

const router = Router();
const controller = new AgendamentosController();

router.get('/', controller.getAgendamentos);
router.get('/estatisticas', controller.getEstatisticas);

export default router;
