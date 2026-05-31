import { Router } from 'express';
import { requireAuth, requireRole } from '@futbalo/utils';
import * as matchesController from '../controllers/matches.controller.js';

export const matchesRouter = Router();

matchesRouter.get('/matches', matchesController.getMatches);
matchesRouter.get('/matches/:id', matchesController.getMatchById);
matchesRouter.post('/matches', requireAuth, requireRole('ADMIN'), matchesController.createMatch);
matchesRouter.patch('/matches/:id', requireAuth, requireRole('ADMIN'), matchesController.updateMatch);
matchesRouter.delete('/matches/:id', requireAuth, requireRole('ADMIN'), matchesController.deleteMatch);
