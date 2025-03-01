import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { backendConfig } from '../../../config/backend';

// Define types for our data
type Course = {
  code: string;
  name: string;
  url: string;
  availability: string;
  period: string;
  credits: string;
  subject: string;
  school_name: string;
  college: string;
  [key: string]: any; // For additional fields from detailed info
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get the course code from the URL
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Course code is required' });
    }
    
    // Path to the scraped data directory
    const dataDir = path.join(process.cwd(), backendConfig.dataDir, 'courses');
    
    // Read all course files
    const files = fs.readdirSync(dataDir);
    let foundCourse: Course | null = null;
    
    // Search for the course in all files
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(dataDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const courses = JSON.parse(fileContent) as Course[];
        
        // Find the course with the matching code
        const course = courses.find(c => c.code.toLowerCase() === code.toLowerCase());
        
        if (course) {
          foundCourse = course;
          break;
        }
      }
    }
    
    // If the course is not found, return a 404
    if (!foundCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Return the course
    res.status(200).json(foundCourse);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
} 