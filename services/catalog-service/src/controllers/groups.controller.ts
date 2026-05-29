import type { RequestHandler } from 'express';
import type { ApiResponse, ApiError, Group, TeamSummary } from '@futbalo/types';
import * as competitionsService from '../services/competitions.js';

export const getGroupById: RequestHandler = async (req, res) => {
  const raw = req.params['id'];
  const id = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  const group = await competitionsService.getGroupById(id);

  if (!group) {
    res.status(404).json({
      message: 'Group not found',
      code: 'CATALOG_003',
      statusCode: 404,
    } satisfies ApiError);
    return;
  }

  res.json({ data: group } satisfies ApiResponse<Group>);
};

export const getGroupTeams: RequestHandler = async (req, res) => {
  const raw = req.params['id'];
  const id = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  const teams = await competitionsService.getGroupTeams(id);

  if (teams === null) {
    res.status(404).json({
      message: 'Group not found',
      code: 'CATALOG_003',
      statusCode: 404,
    } satisfies ApiError);
    return;
  }

  res.json({ data: teams } satisfies ApiResponse<TeamSummary[]>);
};
