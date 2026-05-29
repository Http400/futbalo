import express, { type Express } from 'express';
import cors from 'cors';
import { teamsRouter } from './routes/teams.js';
import { competitionsRouter } from './routes/competitions.js';

export const app: Express = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'catalog-service' });
});

app.use(teamsRouter);
app.use(competitionsRouter);
