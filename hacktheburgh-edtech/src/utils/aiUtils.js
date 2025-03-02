/**
 * AI Utilities for the EdTech application
 * Functions that interact with AI services like OpenAI
 */

const { OpenAI } = require('openai');

/**
 * Generates exactly 3 bullet points for a course based on its description or summary
 * @param {string} summary - The summary of the course
 * @param {string} courseDescription - The detailed description of the course
 * @returns {Promise<string[]>} - A promise that resolves to an array of 3 bullet points
 */
async function generateCourseBullets(summary, courseDescription) {
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is not set');
    return [
      "• This is a placeholder bullet point (OpenAI API key not configured)",
      "• Please set the OPENAI_API_KEY environment variable",
      "• Contact the administrator for assistance"
    ];
  }

  // Initialize the OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Use courseDescription if it's not empty or "Not entered", otherwise use summary
  const textToAnalyze = 
    (!courseDescription || courseDescription.trim() === "" || courseDescription === "Not entered") 
      ? summary 
      : courseDescription;
  
  // If both inputs are empty, return placeholder bullets
  if (!textToAnalyze || textToAnalyze.trim() === "") {
    return [
      "• No course information available",
      "• Please check the course catalog for details",
      "• Contact the course administrator for more information"
    ];
  }

  try {
    // Call the OpenAI API with specific instructions
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful academic assistant that creates concise bullet points about university courses."
        },
        {
          role: "user",
          content: `Generate EXACTLY 3 bullet points that summarize the key aspects of this course. 
          Format each bullet point with a bullet character at the start (•).
          Be concise and focus on what students will learn, key skills, or course highlights.
          Return ONLY the 3 bullet points without any additional text or numbering.
          
          Course information: ${textToAnalyze}`
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    // Extract the bullet points from the response
    const content = response.choices[0].message.content.trim();
    
    // Split by newlines and filter out any empty lines
    let bullets = content.split('\n').filter(line => line.trim() !== '');
    
    // Ensure each bullet starts with the bullet character
    bullets = bullets.map(bullet => 
      bullet.trim().startsWith('•') ? bullet.trim() : `• ${bullet.trim()}`
    );
    
    // If we somehow got more or less than 3 bullets, pad or truncate
    while (bullets.length < 3) {
      bullets.push(`• Additional course information not available`);
    }
    
    // Take only the first 3 if we somehow got more
    bullets = bullets.slice(0, 3);
    
    return bullets;
    
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return [
      "• Error generating course information",
      "• Please try again later",
      "• Contact support if the problem persists"
    ];
  }
}

module.exports = { generateCourseBullets }; 