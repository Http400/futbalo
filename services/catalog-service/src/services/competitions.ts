import { prisma } from '../db.js';

export async function getAllCompetitions() {
  return prisma.competition.findMany({ orderBy: { edition: 'desc' } });
}

export async function getCompetitionById(id: string) {
  return prisma.competition.findUnique({ where: { id } });
}

export async function getGroupsByCompetitionId(competitionId: string) {
  const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
  if (!competition) return null;
  return prisma.group.findMany({ where: { competitionId }, orderBy: { name: 'asc' } });
}

export async function getGroupById(id: string) {
  return prisma.group.findUnique({ where: { id } });
}
