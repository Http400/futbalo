import { Router } from 'express';
import * as groupsController from '../controllers/groups.controller.js';

export const groupsRouter = Router();

groupsRouter.get('/groups/:id', groupsController.getGroupById);
groupsRouter.get('/groups/:id/teams', groupsController.getGroupTeams);
