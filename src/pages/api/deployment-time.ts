import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Use the Vercel deployment timestamp if available, otherwise use current time
      const deploymentTime = process.env.VERCEL_GIT_COMMIT_TIMESTAMP || new Date().toISOString();
      res.status(200).json({ lastDeployment: deploymentTime });
    } catch (error) {
      console.error('Error getting deployment time:', error);
      res.status(500).json({ error: 'Failed to get deployment time' });
    }
  } else {
    res.status(405).end();
  }
} 