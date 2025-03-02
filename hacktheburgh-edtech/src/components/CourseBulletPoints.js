import React, { useState, useEffect } from 'react';

/**
 * Component to display bullet points for a course
 * Uses pre-generated bullet points from course data if available,
 * otherwise falls back to generating them on the client side
 * 
 * @param {Object} props
 * @param {string} props.summary - Course summary text
 * @param {string} props.description - Course detailed description
 * @param {string} props.bulletpoints - Pre-generated bullet points from course data (as string with newlines)
 * @param {string} props.bullet_points - Alternative field name for bullet points (for backward compatibility)
 */
const CourseBulletPoints = ({ summary, description, bulletpoints: existingBulletPoints, bullet_points: oldFormatBulletPoints }) => {
  const [bulletPoints, setBulletPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for bulletpoints in either format (new format 'bulletpoints' or old format 'bullet_points')
    const availableBulletPoints = existingBulletPoints || oldFormatBulletPoints;
    
    // If we already have bullet points in the course data, use those
    if (availableBulletPoints && typeof availableBulletPoints === 'string' && availableBulletPoints.trim()) {
      // Split the string by newlines to get an array of bullet points
      const bulletPointsArray = availableBulletPoints.split('\n').filter(bp => bp.trim());
      setBulletPoints(bulletPointsArray);
      return;
    }
    
    // Otherwise, fetch them from the API
    if (!summary && !description) {
      return;
    }
    
    const fetchBulletPoints = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch('/api/generateBullets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: summary || '',
            courseDescription: description || '',
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setBulletPoints(data.bulletPoints || []);
      } catch (error) {
        console.error('Error fetching bullet points:', error);
        setError('Failed to generate bullet points. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBulletPoints();
  }, [summary, description, existingBulletPoints, oldFormatBulletPoints]);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-500">Generating course overview...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (bulletPoints && bulletPoints.length > 0) {
    return (
      <div className="space-y-2">
        <ul className="space-y-3 text-gray-700">
          {bulletPoints.map((bullet, index) => (
            <li 
              key={index} 
              className="flex items-start"
            >
              <span className="text-blue-500 mr-2 font-bold">•</span>
              <span dangerouslySetInnerHTML={{ 
                __html: bullet.startsWith('•') 
                  ? bullet.substring(1).trim() 
                  : bullet 
              }} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-500 italic">
          This overview is AI-generated and highlights key aspects of the course.
        </p>
      </div>
    );
  }

  return null;
};

export default CourseBulletPoints; 