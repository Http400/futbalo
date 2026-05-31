import { prisma } from '../db.js';
import { Prisma } from '../generated/prisma/index.js';

export async function getAllStages(competitionId?: string) {
  return prisma.stage.findMany({
    where: competitionId !== undefined ? { competitionId } : {},
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getStageById(id: string) {
  return prisma.stage.findUnique({ where: { id } });
}

export type CreateStageInput = {
  code: string;
  name: string;
  sortOrder: number;
  competitionId: string;
};

export async function createStage(
  data: CreateStageInput,
): Promise<'competition_not_found' | 'code_conflict' | Awaited<ReturnType<typeof prisma.stage.create>>> {
  const competition = await prisma.competition.findUnique({ where: { id: data.competitionId } });
  if (!competition) return 'competition_not_found';

  try {
    return await prisma.stage.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return 'code_conflict';
    }
    throw err;
  }
}

export type UpdateStageInput = {
  code?: string;
  name?: string;
  sortOrder?: number;
  competitionId?: string;
};

export async function updateStage(
  id: string,
  data: UpdateStageInput,
): Promise<'not_found' | 'code_conflict' | Awaited<ReturnType<typeof prisma.stage.update>>> {
  try {
    return await prisma.stage.update({ where: { id }, data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') return 'not_found';
      if (err.code === 'P2002') return 'code_conflict';
    }
    throw err;
  }
}

export async function deleteStage(id: string): Promise<boolean> {
  try {
    await prisma.stage.delete({ where: { id } });
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return false;
    }
    throw err;
  }
}
