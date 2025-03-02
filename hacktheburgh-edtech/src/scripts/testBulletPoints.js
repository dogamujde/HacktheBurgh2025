/**
 * A script to test the generateCourseBullets function from the command line
 * 
 * Usage: node -r dotenv/config src/scripts/testBulletPoints.js
 */
const { generateCourseBullets } = require('../utils/aiUtils');

// Example course data
const testCases = [
  {
    name: "Case 1: Using course description",
    summary: "Introduction to programming",
    description: "This comprehensive course introduces students to programming concepts using Python. Topics include variables, data structures, control flow, functions, and basic algorithms. Students will complete several coding projects to reinforce their learning."
  },
  {
    name: "Case 2: Using summary (empty description)",
    summary: "Advanced data structures and algorithms for efficient problem solving",
    description: ""
  },
  {
    name: "Case 3: Using summary ('Not entered' description)",
    summary: "Web development with modern JavaScript frameworks",
    description: "Not entered"
  },
  {
    name: "Case 4: Empty inputs",
    summary: "",
    description: ""
  }
];

// Run the tests
async function runTests() {
  console.log("Testing generateCourseBullets function\n");
  
  for (const testCase of testCases) {
    console.log(`\n== ${testCase.name} ==`);
    console.log(`Summary: ${testCase.summary}`);
    console.log(`Description: ${testCase.description}`);
    
    try {
      console.log("\nGenerating bullet points...");
      const bulletPoints = await generateCourseBullets(testCase.summary, testCase.description);
      
      console.log("\nResults:");
      bulletPoints.forEach(bullet => console.log(bullet));
    } catch (error) {
      console.error("\nError:", error.message);
    }
    
    console.log("\n" + "-".repeat(50));
  }
}

// Run the tests
runTests().catch(error => {
  console.error("Test failed:", error);
  process.exit(1);
}); 