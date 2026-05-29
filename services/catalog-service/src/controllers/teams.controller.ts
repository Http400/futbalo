import type { RequestHandler } from 'express';
import type { ApiResponse, ApiError, Team } from '@futbalo/types';
import * as teamsService from '../services/teams.js';

export const getTeams: RequestHandler = async (_req, res) => {
  const teams = await teamsService.getAllTeams();
  res.json({ data: teams } satisfies ApiResponse<Team[]>);
};

export const getTeamByFifaCode: RequestHandler = async (req, res) => {
  const rawCode = req.params['fifaCode'];
  const fifaCode = Array.isArray(rawCode) ? (rawCode[0] ?? '') : (rawCode ?? '');
  const team = await teamsService.getTeamByFifaCode(fifaCode);

  if (!team) {
    res.status(404).json({
      message: 'Team not found',
      code: 'CATALOG_001',
      statusCode: 404,
    } satisfies ApiError);
    return;
  }

  res.json({ data: team } satisfies ApiResponse<Team>);
};
