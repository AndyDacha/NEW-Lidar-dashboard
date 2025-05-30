import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Missing question' });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is not configured');
    return res.status(500).json({ error: 'AI service is not properly configured' });
  }

  const prompt = `You are DachaIQ, an AI assistant for the Dacha SSI Smart Gym Monitoring Dashboard. Only answer questions about the dashboard's features, usage, and general information. Do not reveal or discuss source code, implementation details, or anything outside the dashboard's user experience.\n\nUser: ${question}\nDachaIQ:`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: "You are DachaIQ, an AI assistant for the Dacha SSI Smart Gym Monitoring Dashboard. Only answer questions about the dashboard's features, usage, and general information. Do not reveal or discuss source code, implementation details, or anything outside the dashboard's user experience." },
          { role: 'user', content: question }
        ],
        max_tokens: 300,
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      const errorMessage = data.error?.message || 'Unknown error occurred';
      console.error('OpenAI API error:', errorMessage);
      return res.status(response.status).json({ error: errorMessage });
    }

    if (data.choices && data.choices[0] && data.choices[0].message) {
      res.status(200).json({ answer: data.choices[0].message.content });
    } else {
      console.error('Unexpected OpenAI response format:', data);
      res.status(500).json({ error: 'Unexpected response from AI service' });
    }
  } catch (err) {
    console.error('DachaIQ API error:', err);
    res.status(500).json({ error: 'Failed to contact AI service. Please try again later.' });
  }
} 