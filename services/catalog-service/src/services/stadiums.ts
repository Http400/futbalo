import { prisma } from '../db.js';

export async function getAllStadiums() {
  return prisma.stadium.findMany({ orderBy: { name: 'asc' } });
}

export async function getStadiumById(id: string) {
  return prisma.stadium.findUnique({ where: { id } });
}
