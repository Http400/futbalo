import { prisma } from '../db.js';
import type { TeamSummary, GroupWithTeams } from '@futbalo/types';

export async function getAllCompetitions() {
  return prisma.competition.findMany({ orderBy: { edition: 'desc' } });
}

export async function getCompetitionById(id: string) {
  return prisma.competition.findUnique({ where: { id } });
}

export async function getGroupsByCompetitionId(competitionId: string): Promise<GroupWithTeams[] | null> {
  const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
  if (!competition) return null;

  const groups = await prisma.group.findMany({
    where: { competitionId },
    orderBy: { name: 'asc' },
    include: {
      groupTeams: {
        include: { team: true },
      },
    },
  });

  return groups.map((g) => ({
    id: g.id,
    competitionId: g.competitionId,
    name: g.name,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
    teams: g.groupTeams.map((gt): TeamSummary => ({
      id: gt.team.id,
      fifaCode: gt.team.fifaCode,
      name: gt.team.name,
      continent: gt.team.continent,
      confederation: gt.team.confederation,
      flagUrl: gt.team.flagUrl,
      flagIcon: gt.team.flagIcon,
    })),
  }));
}

export async function getGroupById(id: string) {
  return prisma.group.findUnique({ where: { id } });
}

export async function getGroupTeams(groupId: string): Promise<TeamSummary[] | null> {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return null;

  const groupTeams = await prisma.groupTeam.findMany({
    where: { groupId },
    include: { team: true },
  });

  return groupTeams.map((gt): TeamSummary => ({
    id: gt.team.id,
    fifaCode: gt.team.fifaCode,
    name: gt.team.name,
    continent: gt.team.continent,
    confederation: gt.team.confederation,
    flagUrl: gt.team.flagUrl,
    flagIcon: gt.team.flagIcon,
  }));
}
