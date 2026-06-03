import type { RequestHandler } from 'express';
import type { ApiResponse, ApiError, Match, PaginatedResponse } from '@futbalo/types';
import type { MatchStatus, MatchResultType } from '../generated/prisma/index.js';
import * as matchesService from '../services/matches.js';
import { parsePagination, buildPaginatedResponse } from '../lib/pagination.js';

const VALID_STATUSES: MatchStatus[] = ['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED', 'POSTPONED'];
const VALID_RESULT_TYPES: MatchResultType[] = ['REGULAR_TIME', 'EXTRA_TIME', 'PENALTIES'];

function isValidStatus(v: unknown): v is MatchStatus {
  return typeof v === 'string' && (VALID_STATUSES as string[]).includes(v);
}

function isValidResultType(v: unknown): v is MatchResultType {
  return typeof v === 'string' && (VALID_RESULT_TYPES as string[]).includes(v);
}

function parseId(raw: unknown): string {
  if (Array.isArray(raw)) return raw[0] ?? '';
  return typeof raw === 'string' ? raw : '';
}

export const getMatches: RequestHandler = async (req, res) => {
  const filters: matchesService.MatchFilters = {};

  const { competitionId, stageId, groupId, teamId, status } = req.query;

  if (typeof competitionId === 'string') filters.competitionId = competitionId;
  if (typeof stageId === 'string') filters.stageId = stageId;
  if (typeof groupId === 'string') filters.groupId = groupId;
  if (typeof teamId === 'string') filters.teamId = teamId;
  if (typeof status === 'string') {
    if (!isValidStatus(status)) {
      res.status(400).json({
        message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'CATALOG_400',
        statusCode: 400,
      } satisfies ApiError);
      return;
    }
    filters.status = status;
  }

  const pagination = parsePagination(req.query as Record<string, unknown>);
  if (!pagination.ok) {
    res.status(400).json({
      message: pagination.error,
      code: 'CATALOG_400',
      statusCode: 400,
    } satisfies ApiError);
    return;
  }

  const { data, total } = await matchesService.getAllMatches(filters, pagination.params);
  res.json(buildPaginatedResponse(data, total, pagination.params) satisfies PaginatedResponse<Match>);
};

export const getMatchById: RequestHandler = async (req, res) => {
  const id = parseId(req.params['id']);
  const match = await matchesService.getMatchById(id);

  if (!match) {
    res.status(404).json({
      message: 'Match not found',
      code: 'CATALOG_006',
      statusCode: 404,
    } satisfies ApiError);
    return;
  }

  res.json({ data: match } satisfies ApiResponse<Match>);
};

export const createMatch: RequestHandler = async (req, res) => {
  const body = req.body as {
    competitionId?: unknown;
    stageId?: unknown;
    stadiumId?: unknown;
    groupId?: unknown;
    homeTeamId?: unknown;
    awayTeamId?: unknown;
    homePlaceholder?: unknown;
    awayPlaceholder?: unknown;
    kickoffAt?: unknown;
    status?: unknown;
  };

  if (
    typeof body.competitionId !== 'string' ||
    typeof body.stageId !== 'string' ||
    typeof body.stadiumId !== 'string'
  ) {
    res.status(400).json({
      message: 'competitionId, stageId, and stadiumId are required strings',
      code: 'CATALOG_400',
      statusCode: 400,
    } satisfies ApiError);
    return;
  }

  const status: MatchStatus = isValidStatus(body.status) ? body.status : 'SCHEDULED';

  const match = await matchesService.createMatch({
    competitionId: body.competitionId,
    stageId: body.stageId,
    stadiumId: body.stadiumId,
    groupId: typeof body.groupId === 'string' ? body.groupId : null,
    homeTeamId: typeof body.homeTeamId === 'string' ? body.homeTeamId : null,
    awayTeamId: typeof body.awayTeamId === 'string' ? body.awayTeamId : null,
    homePlaceholder: typeof body.homePlaceholder === 'string' ? body.homePlaceholder : null,
    awayPlaceholder: typeof body.awayPlaceholder === 'string' ? body.awayPlaceholder : null,
    kickoffAt: typeof body.kickoffAt === 'string' ? new Date(body.kickoffAt) : null,
    status,
  });

  res.status(201).json({ data: match } satisfies ApiResponse<Match>);
};

export const updateMatch: RequestHandler = async (req, res) => {
  const id = parseId(req.params['id']);
  const body = req.body as Record<string, unknown>;

  const data: matchesService.UpdateMatchInput = {};

  if (body['competitionId'] !== undefined) {
    if (typeof body['competitionId'] !== 'string') {
      res.status(400).json({ message: 'competitionId must be a string', code: 'CATALOG_400', statusCode: 400 } satisfies ApiError);
      return;
    }
    data.competitionId = body['competitionId'];
  }
  if (body['stageId'] !== undefined) {
    if (typeof body['stageId'] !== 'string') {
      res.status(400).json({ message: 'stageId must be a string', code: 'CATALOG_400', statusCode: 400 } satisfies ApiError);
      return;
    }
    data.stageId = body['stageId'];
  }
  if (body['stadiumId'] !== undefined) {
    if (typeof body['stadiumId'] !== 'string') {
      res.status(400).json({ message: 'stadiumId must be a string', code: 'CATALOG_400', statusCode: 400 } satisfies ApiError);
      return;
    }
    data.stadiumId = body['stadiumId'];
  }
  if (body['status'] !== undefined) {
    if (!isValidStatus(body['status'])) {
      res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(', ')}`, code: 'CATALOG_400', statusCode: 400 } satisfies ApiError);
      return;
    }
    data.status = body['status'];
  }
  if (body['resultType'] !== undefined) {
    if (body['resultType'] !== null && !isValidResultType(body['resultType'])) {
      res.status(400).json({ message: `resultType must be one of: ${VALID_RESULT_TYPES.join(', ')}`, code: 'CATALOG_400', statusCode: 400 } satisfies ApiError);
      return;
    }
    data.resultType = body['resultType'] === null ? null : (body['resultType'] as MatchResultType);
  }

  // Nullable string fields
  for (const field of ['groupId', 'homeTeamId', 'awayTeamId', 'winnerTeamId', 'homePlaceholder', 'awayPlaceholder'] as const) {
    if (body[field] !== undefined) {
      if (body[field] !== null && typeof body[field] !== 'string') {
        res.status(400).json({ message: `${field} must be a string or null`, code: 'CATALOG_400', statusCode: 400 } satisfies ApiError);
        return;
      }
      data[field] = body[field] as string | null;
    }
  }

  // Nullable number fields
  for (const field of ['homeScore', 'awayScore', 'homePenaltyScore', 'awayPenaltyScore'] as const) {
    if (body[field] !== undefined) {
      if (body[field] !== null && typeof body[field] !== 'number') {
        res.status(400).json({ message: `${field} must be a number or null`, code: 'CATALOG_400', statusCode: 400 } satisfies ApiError);
        return;
      }
      data[field] = body[field] as number | null;
    }
  }

  if (body['kickoffAt'] !== undefined) {
    data.kickoffAt = body['kickoffAt'] === null ? null : new Date(body['kickoffAt'] as string);
  }

  const result = await matchesService.updateMatch(id, data);

  if (result === 'not_found') {
    res.status(404).json({
      message: 'Match not found',
      code: 'CATALOG_006',
      statusCode: 404,
    } satisfies ApiError);
    return;
  }

  res.json({ data: result } satisfies ApiResponse<Match>);
};

export const deleteMatch: RequestHandler = async (req, res) => {
  const id = parseId(req.params['id']);
  const deleted = await matchesService.deleteMatch(id);

  if (!deleted) {
    res.status(404).json({
      message: 'Match not found',
      code: 'CATALOG_006',
      statusCode: 404,
    } satisfies ApiError);
    return;
  }

  res.status(204).send();
};
