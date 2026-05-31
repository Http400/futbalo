import { Router } from 'express';
import { requireAuth, requireRole } from '@futbalo/utils';
import * as stagesController from '../controllers/stages.controller.js';

export const stagesRouter = Router();

stagesRouter.get('/stages', stagesController.getStages);
stagesRouter.get('/stages/:id', stagesController.getStageById);
stagesRouter.post('/stages', requireAuth, requireRole('ADMIN'), stagesController.createStage);
stagesRouter.put('/stages/:id', requireAuth, requireRole('ADMIN'), stagesController.updateStage);
stagesRouter.delete('/stages/:id', requireAuth, requireRole('ADMIN'), stagesController.deleteStage);
