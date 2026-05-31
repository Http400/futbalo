import type { RequestHandler } from 'express';
import type { ApiResponse, ApiError, Stage } from '@futbalo/types';
import * as stagesService from '../services/stages.js';

export const getStages: RequestHandler = async (req, res) => {
  const rawCompetitionId = req.query['competitionId'];
  const competitionId =
    typeof rawCompetitionId === 'string' ? rawCompetitionId : undefined;
  const stages = await stagesService.getAllStages(competitionId);
  res.json({ data: stages } satisfies ApiResponse<Stage[]>);
};

export const getStageById: RequestHandler = async (req, res) => {
  const raw = req.params['id'];
  const id = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  const stage = await stagesService.getStageById(id);

  if (!stage) {
    res.status(404).json({
      message: 'Stage not found',
      code: 'CATALOG_004',
      statusCode: 404,
    } satisfies ApiError);
    return;
  }

  res.json({ data: stage } satisfies ApiResponse<Stage>);
};

export const createStage: RequestHandler = async (req, res) => {
  const { code, name, sortOrder, competitionId } = req.body as {
    code?: unknown;
    name?: unknown;
    sortOrder?: unknown;
    competitionId?: unknown;
  };

  if (
    typeof code !== 'string' ||
    typeof name !== 'string' ||
    typeof sortOrder !== 'number' ||
    typeof competitionId !== 'string'
  ) {
    res.status(400).json({
      message: 'Fields code (string), name (string), sortOrder (number), competitionId (string) are required',
      code: 'CATALOG_400',
      statusCode: 400,
    } satisfies ApiError);
    return;
  }

  const result = await stagesService.createStage({ code, name, sortOrder, competitionId });

  if (result === 'competition_not_found') {
    res.status(404).json({
      message: 'Competition not found',
      code: 'CATALOG_002',
      statusCode: 404,
    } satisfies ApiError);
    return;
  }

  if (result === 'code_conflict') {
    res.status(409).json({
      message: 'Stage with this code already exists for the competition',
      code: 'CATALOG_005',
      statusCode: 409,
    } satisfies ApiError);
    return;
  }

  res.status(201).json({ data: result } satisfies ApiResponse<Stage>);
};

export const updateStage: RequestHandler = async (req, res) => {
  const raw = req.params['id'];
  const id = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');

  const body = req.body as {
    code?: unknown;
    name?: unknown;
    sortOrder?: unknown;
    competitionId?: unknown;
  };

  const data: stagesService.UpdateStageInput = {};
  if (body.code !== undefined) {
    if (typeof body.code !== 'string') {
      res.status(400).json({ message: 'code must be a string', code: 'CATALOG_400', statusCode: 400 } satisfies ApiError);
      return;
    }
    data.code = body.code;
  }
  if (body.name !== undefined) {
    if (typeof body.name !== 'string') {
      res.status(400).json({ message: 'name must be a string', code: 'CATALOG_400', statusCode: 400 } satisfies ApiError);
      return;
    }
    data.name = body.name;
  }
  if (body.sortOrder !== undefined) {
    if (typeof body.sortOrder !== 'number') {
      res.status(400).json({ message: 'sortOrder must be a number', code: 'CATALOG_400', statusCode: 400 } satisfies ApiError);
      return;
    }
    data.sortOrder = body.sortOrder;
  }
  if (body.competitionId !== undefined) {
    if (typeof body.competitionId !== 'string') {
      res.status(400).json({ message: 'competitionId must be a string', code: 'CATALOG_400', statusCode: 400 } satisfies ApiError);
      return;
    }
    data.competitionId = body.competitionId;
  }

  const result = await stagesService.updateStage(id, data);

  if (result === 'not_found') {
    res.status(404).json({
      message: 'Stage not found',
      code: 'CATALOG_004',
      statusCode: 404,
    } satisfies ApiError);
    return;
  }

  if (result === 'code_conflict') {
    res.status(409).json({
      message: 'Stage with this code already exists for the competition',
      code: 'CATALOG_005',
      statusCode: 409,
    } satisfies ApiError);
    return;
  }

  res.json({ data: result } satisfies ApiResponse<Stage>);
};

export const deleteStage: RequestHandler = async (req, res) => {
  const raw = req.params['id'];
  const id = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  const deleted = await stagesService.deleteStage(id);

  if (!deleted) {
    res.status(404).json({
      message: 'Stage not found',
      code: 'CATALOG_004',
      statusCode: 404,
    } satisfies ApiError);
    return;
  }

  res.status(204).send();
};
