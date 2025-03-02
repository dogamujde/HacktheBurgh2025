const { generateCourseBullets } = require('../../utils/aiUtils');

/**
 * API endpoint to generate course bullet points
 * 
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract the summary and description from the request body
    const { summary, courseDescription } = req.body;

    // Validate the input
    if (!summary && !courseDescription) {
      return res.status(400).json({ 
        message: 'Either summary or courseDescription must be provided' 
      });
    }

    // Generate the bullet points
    const bulletPoints = await generateCourseBullets(summary, courseDescription);

    // Return the generated bullet points
    return res.status(200).json({ bulletPoints });
  } catch (error) {
    console.error('Error generating bullet points:', error);
    return res.status(500).json({ 
      message: 'Failed to generate bullet points',
      error: error.message 
    });
  }
} 