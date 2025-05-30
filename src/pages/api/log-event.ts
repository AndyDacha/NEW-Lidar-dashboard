import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const LOG_PATH = path.join(process.cwd(), 'logs.json');

function readLogs() {
  if (!fs.existsSync(LOG_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function writeLogs(logs: any[]) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(logs, null, 2));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const logs = readLogs();
      logs.unshift(req.body); // Add new log to the start
      writeLogs(logs);
      res.setHeader('X-Log-Event', JSON.stringify(req.body));
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error logging event:', error);
      res.status(500).json({ error: 'Failed to log event' });
    }
  } else if (req.method === 'GET') {
    try {
      const logs = readLogs();
      res.status(200).json(logs);
    } catch (error) {
      console.error('Error retrieving logs:', error);
      res.status(500).json({ error: 'Failed to retrieve logs' });
    }
  } else {
    res.status(405).end();
  }
} 