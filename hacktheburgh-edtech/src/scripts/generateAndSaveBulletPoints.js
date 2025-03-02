/**
 * Script to generate bullet points for all courses and save them to the course JSON files
 * 
 * Usage: node -r dotenv/config src/scripts/generateAndSaveBulletPoints.js
 */
const fs = require('fs');
const path = require('path');
const { generateCourseBullets } = require('../utils/aiUtils');

// Path to the scraped data directory
const COURSES_DIR = path.resolve(process.cwd(), '../scraped_data/courses');

// Counters for statistics
let totalCourses = 0;
let coursesWithBullets = 0;
let processedFiles = 0;
let updatedFiles = 0;
let errors = 0;

/**
 * Main function to process all course files
 */
async function main() {
  console.log(`🔍 Scanning for course files in: ${COURSES_DIR}`);
  
  try {
    // Check if directory exists
    if (!fs.existsSync(COURSES_DIR)) {
      console.error(`❌ Directory not found: ${COURSES_DIR}`);
      process.exit(1);
    }
    
    // Get all JSON files in the directory
    const files = fs.readdirSync(COURSES_DIR).filter(file => file.endsWith('.json'));
    console.log(`📊 Found ${files.length} JSON files to process`);
    
    // Process each file
    for (const file of files) {
      processedFiles++;
      const filePath = path.join(COURSES_DIR, file);
      
      try {
        console.log(`\n📄 Processing file (${processedFiles}/${files.length}): ${file}`);
        
        // Read and parse the file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const courses = JSON.parse(fileContent);
        
        // Track if any course in this file was updated
        let fileUpdated = false;
        
        // Process each course in the file
        for (const course of courses) {
          totalCourses++;
          
          // Skip if the course already has bullet points
          if (course.bullet_points && Array.isArray(course.bullet_points) && course.bullet_points.length === 3) {
            coursesWithBullets++;
            continue;
          }
          
          try {
            // Get summary and description for the course
            const summary = course.title || '';
            const description = course.course_description || '';
            
            // Generate bullet points
            const bulletPoints = await generateCourseBullets(summary, description);
            
            // Add bullet points to the course
            course.bullet_points = bulletPoints;
            
            // Mark file as updated
            fileUpdated = true;
            coursesWithBullets++;
            
            console.log(`✅ Generated bullet points for ${course.code}: ${course.title}`);
          } catch (error) {
            console.error(`❌ Error generating bullet points for ${course.code}: ${error.message}`);
            errors++;
          }
        }
        
        // If any course in this file was updated, save the file
        if (fileUpdated) {
          fs.writeFileSync(filePath, JSON.stringify(courses, null, 2), 'utf8');
          updatedFiles++;
          console.log(`💾 Saved updated file: ${file}`);
        }
      } catch (error) {
        console.error(`❌ Error processing file ${file}: ${error.message}`);
        errors++;
      }
    }
    
    // Print summary
    console.log('\n📈 Summary:');
    console.log(`   Files processed: ${processedFiles}`);
    console.log(`   Files updated: ${updatedFiles}`);
    console.log(`   Total courses: ${totalCourses}`);
    console.log(`   Courses with bullet points: ${coursesWithBullets}`);
    console.log(`   Errors: ${errors}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}); 