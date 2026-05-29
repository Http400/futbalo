import type { RequestHandler } from 'express';
import type { ApiResponse, ApiError, Stadium } from '@futbalo/types';
import * as stadiumsService from '../services/stadiums.js';

export const getStadiums: RequestHandler = async (_req, res) => {
  const stadiums = await stadiumsService.getAllStadiums();
  res.json({ data: stadiums } satisfies ApiResponse<Stadium[]>);
};

export const getStadiumById: RequestHandler = async (req, res) => {
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? '');
  const stadium = await stadiumsService.getStadiumById(id);

  if (!stadium) {
    res.status(404).json({
      message: 'Stadium not found',
      code: 'CATALOG_002',
      statusCode: 404,
    } satisfies ApiError);
    return;
  }

  res.json({ data: stadium } satisfies ApiResponse<Stadium>);
};
