import path from 'path';
import fs from 'fs';

/**
 * API endpoint to fetch a course by its code
 * @param {Object} req - HTTP request object with query parameter 'code'
 * @param {Object} res - HTTP response object
 */
export default async function handler(req, res) {
  console.log(`API request received for course code: ${req.query.code}`);
  
  // Check if code is provided in the query
  if (!req.query.code) {
    return res.status(400).json({ error: 'Course code is required' });
  }
  
  const courseCode = req.query.code;
  
  try {
    // Attempt to load campus information from merged_course_data.json
    const path = require('path');
    
    let campusInfo = null;
    let mergedData = null;
    
    // Try to load merged data (which has campus information)
    const mergedDataPath = path.join(process.cwd(), 'scraped_data', 'merged_course_data.json');
    const altMergedDataPath = path.join(process.cwd(), '..', 'scraped_data', 'merged_course_data.json');
    
    console.log(`Attempting to load merged data from: ${mergedDataPath}`);
    
    if (fs.existsSync(mergedDataPath)) {
      console.log('Found merged_course_data.json in primary path');
      const mergedDataContent = fs.readFileSync(mergedDataPath, 'utf8');
      mergedData = JSON.parse(mergedDataContent);
    } else if (fs.existsSync(altMergedDataPath)) {
      console.log('Found merged_course_data.json in alternative path');
      const mergedDataContent = fs.readFileSync(altMergedDataPath, 'utf8');
      mergedData = JSON.parse(mergedDataContent);
    } else {
      console.log('merged_course_data.json not found in either path');
    }
    
    // Check if we found campus data for the requested course
    if (mergedData) {
      console.log(`Looking for course ${courseCode} in merged data`);
      // Find the course in the merged data
      const courseEntry = mergedData.find(entry => entry.course_code === courseCode);
      
      if (courseEntry) {
        console.log(`Found course ${courseCode} in merged data:`, courseEntry);
        // Extract campus information
        campusInfo = courseEntry.campus;
        console.log(`Campus information for ${courseCode}: ${campusInfo}`);
      } else {
        console.log(`Course ${courseCode} not found in merged data`);
      }
    }
    
    // Directory containing course JSON files
    const coursesDir = path.join(process.cwd(), 'scraped_data', 'courses');
    const altCoursesDir = path.join(process.cwd(), '..', 'scraped_data', 'courses');
    
    // If the directory doesn't exist, return a sample course
    if (!fs.existsSync(coursesDir) && !fs.existsSync(altCoursesDir)) {
      console.log('Courses directory not found, returning sample course');
      return res.status(200).json({
        code: courseCode,
        name: "Sample Course",
        period: "Semester 1",
        school_name: "Sample School",
        course_description: "This is a sample course description.",
        credits: "20",
        level: "SCQF Level 10",
        campuses: campusInfo ? [campusInfo] : []  // Use campus info if found
      });
    }
    
    const workingDir = fs.existsSync(coursesDir) ? coursesDir : altCoursesDir;
    const files = fs.readdirSync(workingDir).filter(file => file.endsWith('.json'));
    
    let courseFound = false;
    
    // Search through all course files for the specified course code
    for (const file of files) {
      const filePath = path.join(workingDir, file);
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const courses = JSON.parse(fileContent);
        
        // Find the course in the file
        const course = courses.find(c => c.code === courseCode);
        
        if (course) {
          courseFound = true;
          console.log(`Found course ${courseCode} in ${file}`);
          
          // Add campus information to the course data if available
          if (campusInfo) {
            course.campuses = [campusInfo];
            console.log(`Adding campus information to response: ${campusInfo}`);
          } else {
            course.campuses = [];
            console.log('No campus information found, using empty array');
          }
          
          return res.status(200).json(course);
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    }
    
    // If course not found in any file, return a sample response
    if (!courseFound) {
      console.log(`Course ${courseCode} not found in any file, returning sample course`);
      return res.status(200).json({
        code: courseCode,
        name: "Sample Course Not Found",
        period: "Semester 1",
        school_name: "School Not Found",
        course_description: "This course could not be found in our database.",
        credits: "20",
        level: "SCQF Level 10",
        campuses: campusInfo ? [campusInfo] : []  // Use campus info if found
      });
    }
  } catch (error) {
    console.error('Error in course API:', error);
    return res.status(500).json({
      code: courseCode,
      name: "Error Loading Course",
      period: "Semester 1",
      school_name: "Error",
      course_description: "There was an error loading this course.",
      credits: "20",
      level: "SCQF Level 10",
      campuses: []
    });
  }
} 