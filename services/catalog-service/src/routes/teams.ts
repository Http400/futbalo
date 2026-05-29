import { Router } from 'express';
import * as teamsController from '../controllers/teams.controller.js';

export const teamsRouter = Router();

teamsRouter.get('/teams', teamsController.getTeams);
teamsRouter.get('/teams/:fifaCode', teamsController.getTeamByFifaCode);
