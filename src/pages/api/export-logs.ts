import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const LOG_PATH = path.join(process.cwd(), 'logs.json');
const EXPORT_DIR = path.join(process.cwd(), 'exports');

// Ensure exports directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startDate, endDate, user, action } = req.body;
    let logs = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));

    // Apply filters
    if (startDate) {
      logs = logs.filter((log: any) => new Date(log.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      logs = logs.filter((log: any) => new Date(log.timestamp) <= new Date(endDate));
    }
    if (user) {
      logs = logs.filter((log: any) => log.user === user);
    }
    if (action) {
      logs = logs.filter((log: any) => log.action === action);
    }

    // Create export filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `logs-export-${timestamp}.json`;
    const exportPath = path.join(EXPORT_DIR, filename);

    // Write filtered logs to file
    fs.writeFileSync(exportPath, JSON.stringify(logs, null, 2));

    // Send file to client
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(logs);
  } catch (error) {
    console.error('Error exporting logs:', error);
    res.status(500).json({ error: 'Failed to export logs' });
  }
} 