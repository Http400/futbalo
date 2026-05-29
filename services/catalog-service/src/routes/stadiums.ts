import { Router } from 'express';
import * as stadiumsController from '../controllers/stadiums.controller.js';

export const stadiumsRouter = Router();

stadiumsRouter.get('/stadiums', stadiumsController.getStadiums);
stadiumsRouter.get('/stadiums/:id', stadiumsController.getStadiumById);
