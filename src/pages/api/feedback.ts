import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const feedbackPath = path.join(process.cwd(), 'feedback.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    let feedback = [];
    if (fs.existsSync(feedbackPath)) {
      feedback = JSON.parse(fs.readFileSync(feedbackPath, 'utf8'));
    }
    res.status(200).json(feedback);
  } else if (req.method === 'POST') {
    const { name, email, page, type, benefit, message } = req.body;
    if (!name || !email || !page || !type || !benefit || !message) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    let feedback = [];
    if (fs.existsSync(feedbackPath)) {
      feedback = JSON.parse(fs.readFileSync(feedbackPath, 'utf8'));
    }
    const newItem = {
      id: uuidv4(),
      name,
      email,
      page,
      type,
      benefit,
      message,
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    feedback.unshift(newItem);
    fs.writeFileSync(feedbackPath, JSON.stringify(feedback, null, 2));
    res.status(200).json(feedback);
  } else {
    res.status(405).end();
  }
} 