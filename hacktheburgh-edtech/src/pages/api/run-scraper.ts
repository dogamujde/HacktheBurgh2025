import { NextApiRequest, NextApiResponse } from 'next';
import { runScraper } from '../../scripts/runScraper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Run the scraper
    const result = await runScraper();
    
    // Return the result
    res.status(200).json(result);
  } catch (error) {
    console.error('Error running scraper:', error);
    res.status(500).json({ error: 'Failed to run scraper' });
  }
} 