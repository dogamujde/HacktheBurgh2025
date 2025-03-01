import { NextApiRequest, NextApiResponse } from 'next';
import { checkScrapedData } from '../../scripts/runScraper';
import fs from 'fs';
import path from 'path';
import { backendConfig } from '../../config/backend';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check if the scraped data exists
    const dataExists = checkScrapedData();
    
    // If the data exists, get some stats
    let stats = {};
    
    if (dataExists) {
      const dataDir = path.resolve(process.cwd(), backendConfig.dataDir);
      
      // Get the number of colleges
      const collegesFile = path.join(dataDir, 'all_colleges.json');
      const collegesData = JSON.parse(fs.readFileSync(collegesFile, 'utf8'));
      const collegesCount = collegesData.length;
      
      // Get the number of schools
      const schoolsFile = path.join(dataDir, 'all_schools.json');
      const schoolsData = JSON.parse(fs.readFileSync(schoolsFile, 'utf8'));
      const schoolsCount = schoolsData.length;
      
      // Get the number of course files
      const coursesDir = path.join(dataDir, 'courses');
      const courseFiles = fs.readdirSync(coursesDir);
      const courseFilesCount = courseFiles.length;
      
      // Get the total number of courses
      let totalCoursesCount = 0;
      for (const file of courseFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(coursesDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const courses = JSON.parse(fileContent);
          totalCoursesCount += courses.length;
        }
      }
      
      stats = {
        collegesCount,
        schoolsCount,
        courseFilesCount,
        totalCoursesCount,
        lastUpdated: fs.statSync(collegesFile).mtime,
      };
    }
    
    // Return the status
    res.status(200).json({
      dataExists,
      stats,
    });
  } catch (error) {
    console.error('Error checking scraper status:', error);
    res.status(500).json({ error: 'Failed to check scraper status' });
  }
} 