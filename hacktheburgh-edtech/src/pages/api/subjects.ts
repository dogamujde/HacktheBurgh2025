import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import backendConfig from '@/config/backend';

// Define types for our data
type Subject = {
  name: string;
  url: string;
  school_name: string;
  school_code: string;
  college: string;
};

type School = {
  name: string;
  url: string;
  college: string;
  schedule: string;
  code: string;
  subjects: Subject[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Read the all_schools.json file
    const dataPath = path.join(process.cwd(), backendConfig.scrapedDataDir, 'all_schools.json');
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ message: 'Schools data not found' });
    }
    
    const fileContents = fs.readFileSync(dataPath, 'utf8');
    const schools: School[] = JSON.parse(fileContents);
    
    return res.status(200).json(schools);
  } catch (error) {
    console.error('Error fetching schools data:', error);
    return res.status(500).json({ message: 'Failed to fetch schools data' });
  }
} 