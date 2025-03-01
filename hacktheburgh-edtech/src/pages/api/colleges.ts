import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import backendConfig from '@/config/backend';

// Define types for our data
type College = {
  name: string;
  schools: string[];
};

type School = {
  name: string;
  url: string;
  college: string;
  schedule: string;
  code: string;
};

type ResponseData = {
  colleges?: College[];
  error?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dataPath = path.resolve(backendConfig.scrapedDataDir, 'all_colleges.json');
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: 'Colleges data not found' });
    }

    const collegesData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    res.status(200).json({ colleges: collegesData });
  } catch (error) {
    console.error('Error fetching colleges data:', error);
    res.status(500).json({ error: 'Failed to fetch colleges data' });
  }
} 