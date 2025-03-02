const fs = require('fs');
const path = require('path');

// Directory containing the course JSON files
const coursesDir = path.join(__dirname, '..', 'scraped_data', 'courses');

console.log(`Checking JSON files in ${coursesDir}...`);

// Check if directory exists
if (!fs.existsSync(coursesDir)) {
  console.error(`Directory not found: ${coursesDir}`);
  process.exit(1);
}

// Read all files in the directory
const files = fs.readdirSync(coursesDir);
let validFiles = 0;
let invalidFiles = 0;
let fixedFiles = 0;

for (const file of files) {
  if (file.endsWith('.json')) {
    const filePath = path.join(coursesDir, file);
    
    try {
      // Try to parse the file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      JSON.parse(fileContent);
      console.log(`✅ ${file} - Valid JSON`);
      validFiles++;
    } catch (error) {
      console.error(`❌ ${file} - Invalid JSON: ${error.message}`);
      invalidFiles++;
      
      // Create a backup of the original file
      const backupPath = `${filePath}.backup`;
      console.log(`   Creating backup: ${backupPath}`);
      fs.copyFileSync(filePath, backupPath);
      
      // Try to fix the JSON by adding closing brackets
      try {
        let fileContent = fs.readFileSync(filePath, 'utf8');
        
        // If it's an unexpected end of input, the file might be truncated
        if (error.message.includes('Unexpected end of')) {
          console.log('   Attempting to fix truncated JSON file');
          
          // Try a simple fix by adding closing array bracket
          if (fileContent.trim().startsWith('[')) {
            fileContent = fileContent.trim();
            // Remove trailing comma if present
            if (fileContent.endsWith(',')) {
              fileContent = fileContent.slice(0, -1);
            }
            // Add closing bracket if missing
            if (!fileContent.endsWith(']')) {
              fileContent += ']';
            }
            
            // Test if the fix worked
            try {
              JSON.parse(fileContent);
              fs.writeFileSync(filePath, fileContent);
              console.log(`✅ Fixed ${file}`);
              fixedFiles++;
            } catch (fixError) {
              console.error(`   Failed to fix ${file}: ${fixError.message}`);
              // If fix didn't work, restore from backup
              fs.copyFileSync(backupPath, filePath);
            }
          }
        }
      } catch (fixError) {
        console.error(`   Error trying to fix ${file}: ${fixError.message}`);
      }
    }
  }
}

console.log('\nSummary:');
console.log(`Total JSON files: ${validFiles + invalidFiles}`);
console.log(`Valid files: ${validFiles}`);
console.log(`Invalid files: ${invalidFiles}`);
console.log(`Fixed files: ${fixedFiles}`);

if (invalidFiles > fixedFiles) {
  console.log(`\n⚠️ There are still ${invalidFiles - fixedFiles} corrupted JSON files that need manual fixing.`);
} else if (fixedFiles > 0) {
  console.log('\n✅ All corrupted files have been fixed!');
} 