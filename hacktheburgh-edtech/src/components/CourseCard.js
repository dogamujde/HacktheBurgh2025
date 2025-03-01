import React from 'react';
import Link from 'next/link';

/**
 * CourseCard component displays a course in a card format
 * @param {Object} course - The course object containing details
 */
const CourseCard = ({ course }) => {
  // Safely truncate description to 150 characters if it exists
  const truncatedDescription = course.course_description 
    ? course.course_description.substring(0, 150) + (course.course_description.length > 150 ? '...' : '') 
    : 'No description available';

  // Determine the course level from credit_level or other properties
  const fullLevelInfo = course.credit_level || course.level || course.scqf_level || '';
  
  // Extract just the level number if possible
  let displayLevel = 'N/A';
  if (fullLevelInfo) {
    // Try to extract just the level number (e.g., "SCQF Level 8 (Year 1 Undergraduate)" -> "8")
    const levelMatch = fullLevelInfo.match(/Level (\d+)/i);
    if (levelMatch && levelMatch[1]) {
      displayLevel = levelMatch[1];
    } else {
      // If no match, just use the full string
      displayLevel = fullLevelInfo;
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
      <Link href={`/course/${course.code}`}>
        <div className="cursor-pointer">
          {/* Course Title and Code */}
          <h3 className="text-xl font-semibold text-blue-900 mb-1">
            {course.name} <span className="font-normal">({course.code})</span>
          </h3>
          
          {/* Semester and school info */}
          <p className="text-sm text-gray-500 mb-3">
            {course.period || 'No semester info'} • {course.school_name || 'Unknown School'}
          </p>
          
          {/* Description */}
          <p className="text-gray-700 mb-4 text-sm">
            {truncatedDescription}
          </p>
          
          {/* Credits Badge */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
              {course.credits || 'N/A'} Credits • Level {displayLevel}
            </span>
            
            {/* View Details link */}
            <span className="text-blue-600 text-sm hover:text-blue-800 hover:underline">
              View Details →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CourseCard; 