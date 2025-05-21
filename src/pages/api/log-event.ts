import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const logPath = path.join(process.cwd(), 'logs.json');
  if (req.method === 'POST') {
    const logs = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : [];
    logs.unshift(req.body); // add new log at the start
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    res.status(200).json({ success: true });
  } else if (req.method === 'GET') {
    const logs = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : [];
    res.status(200).json(logs);
  } else {
    res.status(405).end();
  }
} 