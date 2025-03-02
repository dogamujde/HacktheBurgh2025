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
  school_name?: string;
  school?: string;
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
    const { 
      schools, 
      search,
      subjects,
      creditLevels,
      minCredits,
      maxCredits,
      years,
      courseLevel,
      visitingStudents,
      deliveryMethod,
      showUnavailableCourses 
    } = req.query;
    
    console.log('API request received:', { 
      schools, 
      search,
      subjects,
      creditLevels,
      minCredits,
      maxCredits,
      years,
      courseLevel,
      visitingStudents,
      deliveryMethod,
      showUnavailableCourses
    });

    const coursesDir = path.join(process.cwd(), '..', 'scraped_data', 'courses');
    
    // Check if directory exists
    if (!fs.existsSync(coursesDir)) {
      console.error(`Courses directory not found: ${coursesDir}`);
      console.log('Current working directory:', process.cwd());
      
      // Try an alternative path
      const altCoursesDir = path.join(process.cwd(), 'scraped_data', 'courses');
      if (fs.existsSync(altCoursesDir)) {
        console.log(`Using alternative path: ${altCoursesDir}`);
        // Use the alternative path instead
        return altPathHandler(req, res);
      }
      
      return res.status(500).json({ error: 'Courses directory not found' });
    }
    
    const files = fs.readdirSync(coursesDir);
    let allCourses: Course[] = [];
    let totalProcessed = 0;
    let totalInvalid = 0;
    let schoolsChecked: string[] = [];
    
    const schoolsList = schools ? (schools as string).split(',') : [];
    console.log('Requested schools:', schoolsList);
    
    // If schools are requested, first check all files regardless of name
    if (schoolsList.length > 0) {
      console.log('Looking for schools in all files since school filter is active');
    }
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(coursesDir, file);
        
        try {
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          totalProcessed++;
          
          // Don't pre-filter files by name when school filter is active
          // We need to check ALL files for course.school_name
          let shouldCheckFile = true;
          
          if (schoolsList.length > 0) {
            schoolsChecked.push(file);
          }
          
          // Process courses in the file
          if (Array.isArray(fileData)) {
            const filteredCourses = fileData.filter(course => {
              // Check both school_name and school fields for match if school filter is provided
              if (schoolsList.length > 0) {
                const courseSchool = course.school_name || course.school || '';
                const matchesRequestedSchool = schoolsList.some(requestedSchool => {
                  return courseSchool.toLowerCase().includes(requestedSchool.toLowerCase());
                });
                
                if (!matchesRequestedSchool) {
                  return false;
                }
              }
              
              // Filter out courses not delivered this year unless showUnavailableCourses is true
              if (showUnavailableCourses !== 'true') {
                if (course.period && course.period === "Not delivered this year") {
                  return false;
                }
              }
              
              // Search filter
              if (search && typeof search === 'string') {
                const searchLower = search.toLowerCase();
                const nameMatch = (course.name || course.title || '').toLowerCase().includes(searchLower);
                const codeMatch = (course.code || '').toLowerCase().includes(searchLower);
                const descMatch = (course.course_description || '').toLowerCase().includes(searchLower);
                
                return nameMatch || codeMatch || descMatch;
              }
              
              return true;
            });
            
            if (filteredCourses.length > 0) {
              console.log(`Found ${filteredCourses.length} matching courses in ${file}`);
            }
            
            allCourses = [...allCourses, ...filteredCourses];
          }
        } catch (error) {
          totalInvalid++;
          console.error(`Error parsing ${file}:`, error);
          // Continue processing other files even if one has an error
        }
      }
    }
    
    console.log(`Processed ${totalProcessed} files, ${totalInvalid} invalid, found ${allCourses.length} courses`);
    console.log('Schools checked:', schoolsChecked);
    
    res.status(200).json({ courses: allCourses });
  } catch (error) {
    console.error('Error in API route:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
}

// Helper function to handle the alternative path
function altPathHandler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    const { 
      schools, 
      search,
      subjects,
      creditLevels,
      minCredits,
      maxCredits,
      years,
      courseLevel,
      visitingStudents,
      deliveryMethod,
      showUnavailableCourses 
    } = req.query;
    
    const coursesDir = path.join(process.cwd(), 'scraped_data', 'courses');
    
    console.log(`Using path: ${coursesDir}`);
    console.log('API request received:', { 
      schools, 
      search,
      subjects,
      creditLevels,
      minCredits,
      maxCredits,
      years,
      courseLevel,
      visitingStudents,
      deliveryMethod,
      showUnavailableCourses
    });
    
    const files = fs.readdirSync(coursesDir);
    let allCourses: Course[] = [];
    let totalProcessed = 0;
    let totalInvalid = 0;
    let schoolsChecked: string[] = [];
    
    const schoolsList = schools ? (schools as string).split(',') : [];
    console.log('Requested schools:', schoolsList);
    
    // If schools are requested, first check all files regardless of name
    if (schoolsList.length > 0) {
      console.log('Looking for schools in all files since school filter is active');
    }
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(coursesDir, file);
        
        try {
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          totalProcessed++;
          
          // Don't pre-filter files by name when school filter is active
          // We need to check ALL files for course.school_name
          if (schoolsList.length > 0) {
            schoolsChecked.push(file);
          }
          
          // Process courses in the file
          if (Array.isArray(fileData)) {
            const filteredCourses = fileData.filter(course => {
              // Check both school_name and school fields for match if school filter is provided
              if (schoolsList.length > 0) {
                const courseSchool = course.school_name || course.school || '';
                const matchesRequestedSchool = schoolsList.some(requestedSchool => {
                  return courseSchool.toLowerCase().includes(requestedSchool.toLowerCase());
                });
                
                if (!matchesRequestedSchool) {
                  return false;
                }
              }
              
              // Filter out courses not delivered this year unless showUnavailableCourses is true
              if (showUnavailableCourses !== 'true') {
                if (course.period && course.period === "Not delivered this year") {
                  return false;
                }
              }
              
              // Search filter
              if (search && typeof search === 'string') {
                const searchLower = search.toLowerCase();
                const nameMatch = (course.name || course.title || '').toLowerCase().includes(searchLower);
                const codeMatch = (course.code || '').toLowerCase().includes(searchLower);
                const descMatch = (course.course_description || '').toLowerCase().includes(searchLower);
                
                return nameMatch || codeMatch || descMatch;
              }
              
              return true;
            });
            
            if (filteredCourses.length > 0) {
              console.log(`Found ${filteredCourses.length} matching courses in ${file}`);
            }
            
            allCourses = [...allCourses, ...filteredCourses];
          }
        } catch (error) {
          totalInvalid++;
          console.error(`Error parsing ${file}:`, error);
          // Continue processing other files even if one has an error
        }
      }
    }
    
    console.log(`Processed ${totalProcessed} files, ${totalInvalid} invalid, found ${allCourses.length} courses`);
    console.log('Schools checked:', schoolsChecked);
    
    res.status(200).json({ courses: allCourses });
  } catch (error) {
    console.error('Error in API route:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
} 