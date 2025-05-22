import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Store the log in the response headers for client-side storage
      res.setHeader('X-Log-Event', JSON.stringify(req.body));
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error logging event:', error);
      res.status(500).json({ error: 'Failed to log event' });
    }
  } else if (req.method === 'GET') {
    try {
      // Return empty array - client will handle storage
      res.status(200).json([]);
    } catch (error) {
      console.error('Error retrieving logs:', error);
      res.status(500).json({ error: 'Failed to retrieve logs' });
    }
  } else {
    res.status(405).end();
  }
} 