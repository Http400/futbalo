import { Router } from 'express';
import * as matchesController from '../controllers/matches.controller.js';

export const matchesRouter = Router();

matchesRouter.get('/matches', matchesController.getMatches);
matchesRouter.get('/matches/:id', matchesController.getMatchById);
matchesRouter.post('/matches', matchesController.createMatch);
matchesRouter.patch('/matches/:id', matchesController.updateMatch);
matchesRouter.delete('/matches/:id', matchesController.deleteMatch);
