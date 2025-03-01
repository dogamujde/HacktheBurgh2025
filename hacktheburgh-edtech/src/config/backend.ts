/**
 * Backend configuration
 */
const backendConfig = {
  // Path to the scraped data directory
  dataDir: process.env.NEXT_PUBLIC_DATA_DIR || '../scraped_data',
  
  // Properly resolved path for API routes
  scrapedDataDir: process.env.NEXT_PUBLIC_DATA_DIR 
    ? process.env.NEXT_PUBLIC_DATA_DIR
    : '../scraped_data',
  
  // API endpoints
  endpoints: {
    courses: '/api/courses',
    colleges: '/api/colleges',
    subjects: '/api/subjects',
  },
  
  // Scraper settings
  scraper: {
    // Command to run the scraper
    command: 'python3 ../scraper.py',
    
    // Whether to run the scraper automatically on server start
    runOnStart: false,
    
    // How often to run the scraper (in milliseconds)
    // 0 means don't run automatically
    runInterval: 0,
  },
};

export default backendConfig;

/**
 * Function to get the path to a specific data file
 */
export function getDataPath(type: 'courses' | 'colleges' | 'schools' | 'subjects', filename?: string): string {
  const baseDir = backendConfig.dataDir;
  
  switch (type) {
    case 'courses':
      return filename 
        ? `${baseDir}/courses/${filename}` 
        : `${baseDir}/courses`;
    case 'colleges':
      return filename 
        ? `${baseDir}/colleges/${filename}` 
        : `${baseDir}/colleges`;
    case 'schools':
      return filename 
        ? `${baseDir}/schools/${filename}` 
        : `${baseDir}/schools`;
    case 'subjects':
      // Subjects are stored within school files
      return `${baseDir}/schools`;
    default:
      return baseDir;
  }
} 