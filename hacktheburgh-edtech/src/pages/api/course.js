import path from 'path';
import fs from 'fs';

/**
 * API endpoint to fetch a course by its code
 * @param {Object} req - HTTP request object with query parameter 'code'
 * @param {Object} res - HTTP response object
 */
export default async function handler(req, res) {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Course code is required' });
  }
  
  try {
    // Get the directory where course JSON files are stored
    const coursesDir = path.join(process.cwd(), 'scraped_data', 'courses');
    const files = fs.readdirSync(coursesDir).filter(file => file.endsWith('.json'));
    
    // Search for the course in all course files
    for (const file of files) {
      const filePath = path.join(coursesDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const courses = JSON.parse(fileContent);
      
      // Check if the course exists in this file
      const course = courses.find(c => c.code === code);
      if (course) {
        return res.status(200).json(course);
      }
    }
    
    // If we reach here, the course was not found
    return res.status(404).json({ error: 'Course not found' });
  } catch (error) {
    console.error('Error fetching course:', error);
    return res.status(500).json({ error: 'Failed to fetch course data' });
  }
} 