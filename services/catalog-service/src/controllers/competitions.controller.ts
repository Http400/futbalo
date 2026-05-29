import type { RequestHandler } from 'express';
import type { ApiResponse, ApiError, Competition, Group } from '@futbalo/types';
import * as competitionsService from '../services/competitions.js';

export const getCompetitions: RequestHandler = async (_req, res) => {
  const competitions = await competitionsService.getAllCompetitions();
  res.json({ data: competitions } satisfies ApiResponse<Competition[]>);
};

export const getCompetitionById: RequestHandler = async (req, res) => {
  const raw = req.params['id'];
  const id = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  const competition = await competitionsService.getCompetitionById(id);

  if (!competition) {
    res.status(404).json({
      message: 'Competition not found',
      code: 'CATALOG_002',
      statusCode: 404,
    } satisfies ApiError);
    return;
  }

  res.json({ data: competition } satisfies ApiResponse<Competition>);
};

export const getGroupsByCompetitionId: RequestHandler = async (req, res) => {
  const raw = req.params['id'];
  const id = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  const groups = await competitionsService.getGroupsByCompetitionId(id);

  if (groups === null) {
    res.status(404).json({
      message: 'Competition not found',
      code: 'CATALOG_002',
      statusCode: 404,
    } satisfies ApiError);
    return;
  }

  res.json({ data: groups } satisfies ApiResponse<Group[]>);
};

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
