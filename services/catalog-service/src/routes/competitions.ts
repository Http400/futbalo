import { Router } from 'express';
import * as competitionsController from '../controllers/competitions.controller.js';

export const competitionsRouter = Router();

competitionsRouter.get('/competitions', competitionsController.getCompetitions);
competitionsRouter.get('/competitions/:id', competitionsController.getCompetitionById);
competitionsRouter.get('/competitions/:id/groups', competitionsController.getGroupsByCompetitionId);
competitionsRouter.get('/groups/:id', competitionsController.getGroupById);
