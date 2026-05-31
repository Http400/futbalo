import { prisma } from '../db.js';
import { Prisma } from '../generated/prisma/index.js';
import type { MatchStatus, MatchResultType } from '../generated/prisma/index.js';

export type MatchFilters = {
  competitionId?: string;
  stageId?: string;
  groupId?: string;
  teamId?: string;
  status?: MatchStatus;
};

export async function getAllMatches(filters: MatchFilters = {}) {
  const where: Prisma.MatchWhereInput = {};

  if (filters.competitionId) where.competitionId = filters.competitionId;
  if (filters.stageId) where.stageId = filters.stageId;
  if (filters.groupId) where.groupId = filters.groupId;
  if (filters.status) where.status = filters.status;
  if (filters.teamId) {
    where.OR = [{ homeTeamId: filters.teamId }, { awayTeamId: filters.teamId }];
  }

  return prisma.match.findMany({ where, orderBy: { kickoffAt: 'asc' } });
}

export async function getMatchById(id: string) {
  return prisma.match.findUnique({ where: { id } });
}

export type CreateMatchInput = {
  competitionId: string;
  stageId: string;
  stadiumId: string;
  groupId?: string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
  kickoffAt?: Date | null;
  status?: MatchStatus;
};

export async function createMatch(data: CreateMatchInput) {
  return prisma.match.create({ data });
}

export type UpdateMatchInput = {
  competitionId?: string;
  stageId?: string;
  stadiumId?: string;
  groupId?: string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
  kickoffAt?: Date | null;
  status?: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  winnerTeamId?: string | null;
  resultType?: MatchResultType | null;
};

export async function updateMatch(
  id: string,
  data: UpdateMatchInput,
): Promise<'not_found' | Awaited<ReturnType<typeof prisma.match.update>>> {
  try {
    return await prisma.match.update({ where: { id }, data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return 'not_found';
    }
    throw err;
  }
}

export async function deleteMatch(id: string): Promise<boolean> {
  try {
    await prisma.match.delete({ where: { id } });
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return false;
    }
    throw err;
  }
}
