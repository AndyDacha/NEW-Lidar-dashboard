import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Fetch all clubs
    const clubs = await prisma.club.findMany();
    return res.status(200).json(clubs);
  }
  if (req.method === 'POST') {
    // Add a new club
    const { name, location, region } = req.body;
    if (!name || !location || !region) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const club = await prisma.club.create({
      data: { name, location, region },
    });
    return res.status(201).json(club);
  }
  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 