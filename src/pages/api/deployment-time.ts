import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const logPath = path.join(process.cwd(), 'deployment-log.json');
      if (fs.existsSync(logPath)) {
        const log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        if (log && log.length > 0) {
          res.status(200).json({ lastDeployment: log[0].date });
          return;
        }
      }
      res.status(200).json({ lastDeployment: new Date().toISOString() });
    } catch (error) {
      console.error('Error reading deployment time:', error);
      res.status(500).json({ error: 'Failed to get deployment time' });
    }
  } else {
    res.status(405).end();
  }
} 