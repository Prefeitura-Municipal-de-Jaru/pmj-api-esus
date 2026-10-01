import { Router } from 'express';
import agendamentosRoutes from './agendamentos.routes.js';
import unidadesRoutes from './unidades.routes.js';
import healthRoutes from './health.routes.js';
import { AgendamentosController } from '../controllers/agendamentos.controller.js';

const router = Router();
const agendamentosController = new AgendamentosController();

// Rotas principais padronizadas
router.use('/health', healthRoutes);
router.use('/agendamentos', agendamentosRoutes);
router.get('/estatisticas', agendamentosController.getEstatisticas);
router.use('/unidades', unidadesRoutes);

// Rotas de compatibilidade (prefixo /esus utilizado no frontend existente)
router.use('/esus/agendamentos', agendamentosRoutes);
router.get('/esus/estatisticas', agendamentosController.getEstatisticas);
router.use('/esus/unidades', unidadesRoutes);

export default router;
