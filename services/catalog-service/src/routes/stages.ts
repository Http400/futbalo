import { Router } from 'express';
import * as stagesController from '../controllers/stages.controller.js';

export const stagesRouter = Router();

stagesRouter.get('/stages', stagesController.getStages);
stagesRouter.get('/stages/:id', stagesController.getStageById);
stagesRouter.post('/stages', stagesController.createStage);
stagesRouter.put('/stages/:id', stagesController.updateStage);
stagesRouter.delete('/stages/:id', stagesController.deleteStage);
