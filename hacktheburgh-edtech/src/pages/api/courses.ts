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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { school, code, search, years } = req.query;
    
    console.log('API Request Query Parameters:', {
      school: school || 'not provided',
      code: code || 'not provided',
      search: search || 'not provided',
      years: years || 'not provided'
    });

    const coursesDir = path.resolve(backendConfig.scrapedDataDir, 'courses');
    let allCourses: Course[] = [];
    
    // Read all course data from JSON files
    const files = fs.readdirSync(coursesDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(coursesDir, file);
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          // Filter by school if provided
          if (school && !file.toLowerCase().includes((school as string).toLowerCase())) {
            continue;
          }
          
          if (Array.isArray(fileData)) {
            allCourses = [...allCourses, ...fileData];
          }
        } catch (fileError) {
          console.error(`Error reading/parsing file ${file}:`, fileError);
          // Continue with other files instead of breaking the entire API
          continue;
        }
      }
    }
    
    let courses = allCourses;
    
    // Filter by course code if provided
    if (code) {
      const codeSearch = (code as string).toLowerCase();
      courses = courses.filter(course => 
        course.code && course.code.toLowerCase().includes(codeSearch)
      );
    }
    
    // Filter by years if provided
    if (years) {
      try {
        // Parse the years from the comma-separated string and convert to numbers
        const yearValues = (years as string)
          .split(',')
          .map(year => year.trim())
          .map(year => parseInt(year))
          .filter(year => !isNaN(year));
        
        console.log('Years filter (parsed values):', yearValues);
        
        if (yearValues.length > 0) {
          const originalCount = courses.length;
          
          // Enhanced year extraction and filtering logic
          courses = courses.filter(course => {
            // Skip courses without necessary data
            if (!course) return false;
            
            // Extract year from credit_level or level string (e.g., "SCQF Level 8 (Year 1 Undergraduate)" -> 1)
            const levelString = (course.credit_level || course.level || '').toString();
            
            // Skip courses with no level information
            if (!levelString) {
              return false;
            }
            
            // Direct year pattern matching - this is the most reliable method
            const yearMatch = levelString.match(/Year (\d+)/i);
            if (yearMatch) {
              const year = parseInt(yearMatch[1]);
              return yearValues.includes(year);
            }
            
            // For postgraduate courses
            if (levelString.toLowerCase().includes('postgraduate')) {
              return yearValues.includes(5);
            }
            
            // Try to infer year from SCQF level
            const levelMatch = levelString.match(/Level (\d+)/i);
            if (levelMatch) {
              const level = parseInt(levelMatch[1]);
              
              // For undergraduate courses
              if (levelString.toLowerCase().includes('undergraduate')) {
                // Map SCQF levels to years:
                // Level 7-8 → Year 1
                // Level 9 → Year 2
                // Level 10 → Year 3/4
                // Level 11+ → Postgraduate
                if (level === 7 || level === 8) return yearValues.includes(1);
                if (level === 9) return yearValues.includes(2);
                if (level === 10) return yearValues.includes(3) || yearValues.includes(4);
                if (level >= 11) return yearValues.includes(5);
              }
              
              // More general mapping as fallback
              if (level >= 7 && level <= 10) {
                const year = Math.min(Math.ceil((level - 6) / 2), 4);
                return yearValues.includes(year);
              }
            }
            
            return false;
          });
          
          console.log(`Filtered from ${originalCount} to ${courses.length} courses based on year filter`);
        } else {
          console.log('No valid year values provided in years parameter');
        }
      } catch (error) {
        console.error('Error processing years filter:', error);
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