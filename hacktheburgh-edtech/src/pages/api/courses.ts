import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import backendConfig from '@/config/backend';

// Define types for our data
type Course = {
  code: string;
  title?: string;
  name?: string;
  credits: string;
  level?: string;
  semester?: string;
  year?: string;
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
    const { school, code, search, years } = req.query;
    const coursesDir = path.resolve(backendConfig.scrapedDataDir, 'courses');
    
    if (!fs.existsSync(coursesDir)) {
      return res.status(404).json({ error: 'Course data not found' });
    }

    let courses: Course[] = [];

    // Read all course files
    const courseFiles = fs.readdirSync(coursesDir);
    
    for (const file of courseFiles) {
      if (file.endsWith('.json') && !file.endsWith('.bak')) {
        const filePath = path.join(coursesDir, file);
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const fileData = JSON.parse(fileContent);
          
          // Filter by school if provided
          if (school && !file.includes(school as string)) {
            continue;
          }
          
          // Add courses from this file to our list
          if (Array.isArray(fileData)) {
            courses.push(...fileData);
          } else if (typeof fileData === 'object') {
            // Handle case where file contains a single course
            courses.push(fileData);
          }
        } catch (error) {
          console.error(`Error reading or parsing ${file}:`, error);
          // Continue with other files even if one fails
          continue;
        }
      }
    }
    
    // Filter by course code if provided
    if (code) {
      const codeSearch = (code as string).toLowerCase();
      courses = courses.filter(course => 
        course.code && course.code.toLowerCase().includes(codeSearch)
      );
    }
    
    // Filter by years if provided
    if (years) {
      // Parse the years from the comma-separated string and convert to numbers
      const yearValues = (years as string).split(',').map(y => parseInt(y.trim())).filter(y => !isNaN(y));
      
      if (yearValues.length > 0) {
        courses = courses.filter(course => {
          const levelString = course.level || '';
          
          // Try to extract year directly from the level string
          const yearMatch = levelString.match(/Year (\d+)/i);
          if (yearMatch) {
            const year = parseInt(yearMatch[1]);
            return yearValues.includes(year);
          }
          
          // Try to infer year from the SCQF level for undergraduate courses
          const levelMatch = levelString.match(/Level (\d+)/);
          if (levelMatch && levelString.toLowerCase().includes('undergraduate')) {
            const level = parseInt(levelMatch[1]);
            // Map SCQF levels to years (approximate mapping: level 7-8 -> year 1, 9-10 -> year 2, etc.)
            const year = level >= 7 ? Math.min(Math.ceil((level - 6) / 2), 4) : null;
            return year && yearValues.includes(year);
          }
          
          // For postgraduate courses, assume they're year 5 if the filter includes year 5
          if (levelString.toLowerCase().includes('postgraduate')) {
            return yearValues.includes(5);
          }
          
          return false;
        });
      }
    }
    
    // Filter by search term if provided
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      courses = courses.filter(course => {
        // Check both title and name properties (handle inconsistencies in data)
        const title = course.title || course.name || '';
        const description = course.course_description || '';
        
        return (
          title.toLowerCase().includes(searchTerm) || 
          course.code.toLowerCase().includes(searchTerm) ||
          description.toLowerCase().includes(searchTerm)
        );
      });
      
      // Sort courses to prioritize those with search term in the name
      courses.sort((a, b) => {
        const titleA = (a.title || a.name || '').toLowerCase();
        const titleB = (b.title || b.name || '').toLowerCase();
        
        // Check if search term is in the name/title
        const searchInTitleA = titleA.includes(searchTerm);
        const searchInTitleB = titleB.includes(searchTerm);
        
        // Prioritize courses with search term in title/name
        if (searchInTitleA && !searchInTitleB) return -1;
        if (!searchInTitleA && searchInTitleB) return 1;
        
        // If both have or don't have the search term in title/name, keep original order
        return 0;
      });
    }
    
    res.status(200).json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
} 