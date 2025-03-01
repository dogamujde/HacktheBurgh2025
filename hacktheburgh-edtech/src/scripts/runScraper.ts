import { exec } from 'child_process';
import { backendConfig } from '../config/backend';
import path from 'path';
import fs from 'fs';

/**
 * Run the scraper and return a promise that resolves when it's done
 */
export function runScraper(): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve, reject) => {
    console.log('Running scraper...');
    
    // Get the command from config
    const command = backendConfig.scraper.command;
    
    // Execute the command
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running scraper: ${error.message}`);
        return reject({ success: false, message: error.message });
      }
      
      if (stderr) {
        console.error(`Scraper stderr: ${stderr}`);
      }
      
      console.log(`Scraper stdout: ${stdout}`);
      console.log('Scraper completed successfully');
      
      return resolve({ success: true, message: 'Scraper completed successfully' });
    });
  });
}

/**
 * Check if the scraped data exists
 */
export function checkScrapedData(): boolean {
  try {
    // Check if the scraped_data directory exists
    const dataDir = path.resolve(process.cwd(), backendConfig.dataDir);
    if (!fs.existsSync(dataDir)) {
      return false;
    }
    
    // Check if the all_colleges.json file exists
    const collegesFile = path.join(dataDir, 'all_colleges.json');
    if (!fs.existsSync(collegesFile)) {
      return false;
    }
    
    // Check if the all_schools.json file exists
    const schoolsFile = path.join(dataDir, 'all_schools.json');
    if (!fs.existsSync(schoolsFile)) {
      return false;
    }
    
    // Check if the courses directory exists and has files
    const coursesDir = path.join(dataDir, 'courses');
    if (!fs.existsSync(coursesDir)) {
      return false;
    }
    
    const courseFiles = fs.readdirSync(coursesDir);
    if (courseFiles.length === 0) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking scraped data:', error);
    return false;
  }
}

/**
 * Run the scraper if the data doesn't exist
 */
export async function ensureScrapedData(): Promise<void> {
  if (!checkScrapedData()) {
    console.log('Scraped data not found. Running scraper...');
    await runScraper();
  } else {
    console.log('Scraped data found. Skipping scraper run.');
  }
}

// If this script is run directly, run the scraper
if (require.main === module) {
  runScraper()
    .then(result => {
      console.log(result.message);
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to run scraper:', error);
      process.exit(1);
    });
} 