# AI Features - EdTech Application

This document provides information about the AI features integrated into the EdTech application.

## Course Bullet Points Generation

The application includes functionality to automatically generate concise bullet points for course descriptions using OpenAI's GPT models.

### Setup

1. Install the required dependencies:
   ```bash
   npm install openai
   ```

2. Set your OpenAI API key in the `.env.local` file:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```

3. Restart your development server after adding the API key.

### Using the Function

The `generateCourseBullets` function is available in `src/utils/aiUtils.js` and can be imported and used in your components or API routes:

```javascript
import { generateCourseBullets } from '../utils/aiUtils';

// Example usage
async function displayCourseBullets() {
  const summary = "This course covers advanced programming concepts.";
  const description = "Students will learn about data structures, algorithms, and software design patterns through practical examples and projects.";
  
  const bulletPoints = await generateCourseBullets(summary, description);
  
  // bulletPoints will be an array of 3 strings, each starting with a bullet character (•)
  console.log(bulletPoints);
}
```

### API Endpoint

A sample API endpoint is available at `/api/generateBullets` that accepts POST requests with the following JSON structure:

```json
{
  "summary": "Brief course summary",
  "courseDescription": "Detailed course description"
}
```

Example fetch request:

```javascript
const response = await fetch('/api/generateBullets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    summary: "Programming fundamentals course",
    courseDescription: "Learn the basics of coding with JavaScript, including variables, functions, and control flow."
  }),
});

const data = await response.json();
console.log(data.bulletPoints); // Array of 3 bullet points
```

### Implementation Details

- The function uses the `gpt-4o-mini` model from OpenAI.
- It prioritizes the `courseDescription` parameter if it's not empty or "Not entered".
- If both inputs are empty, it returns placeholder bullet points.
- The function handles error cases gracefully, providing fallback bullet points.
- It ensures exactly 3 bullet points are returned, with proper formatting. 