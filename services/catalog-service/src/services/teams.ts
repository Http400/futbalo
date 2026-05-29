import { prisma } from '../db.js';

export async function getAllTeams() {
  return prisma.team.findMany({ orderBy: { name: 'asc' } });
}

export async function getTeamByFifaCode(fifaCode: string) {
  return prisma.team.findUnique({ where: { fifaCode } });
}
