import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import backendConfig from '@/config/backend';

// Define types for our data
type Course = {
  code: string;
  title: string;
  credits: string;
  level: string;
  semester: string;
  year: string;
  [key: string]: any; // For additional fields from detailed info
};

type ResponseData = {
  courses?: Course[];
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
    const { school, code, search } = req.query;
    const coursesDir = path.resolve(backendConfig.scrapedDataDir, 'courses');
    
    if (!fs.existsSync(coursesDir)) {
      return res.status(404).json({ error: 'Course data not found' });
    }

    let courses: Course[] = [];

    // Read all course files
    const courseFiles = fs.readdirSync(coursesDir);
    
    for (const file of courseFiles) {
      if (file.endsWith('.json')) {
        const filePath = path.join(coursesDir, file);
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Filter by school if provided
        if (school && !file.includes(school as string)) {
          continue;
        }
        
        // Add courses from this file to our list
        courses.push(...fileData);
      }
    }
    
    // Filter by course code if provided
    if (code) {
      courses = courses.filter(course => 
        course.code.toLowerCase().includes((code as string).toLowerCase())
      );
    }
    
    // Filter by search term if provided
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      courses = courses.filter(course => 
        course.title.toLowerCase().includes(searchTerm) || 
        course.code.toLowerCase().includes(searchTerm)
      );
    }
    
    res.status(200).json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
} 