import React, { useState } from 'react';
import Link from 'next/link';

/**
 * CourseCard component displays a course in a card format with flip animation
 * @param {Object} course - The course object containing details
 */
const CourseCard = ({ course }) => {
  const [isFlipped, setIsFlipped] = useState(false);

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

  // Check if course is online
  const isOnline = course.delivery_method?.toLowerCase().includes('online') || 
                  course.period?.toLowerCase().includes('online') ||
                  course.summary?.toLowerCase().includes('online') ||
                  course.course_description?.toLowerCase().includes('online delivery');

  // Handle card flip
  const handleCardClick = (e) => {
    // Prevent navigation when clicking the card
    e.preventDefault();
    setIsFlipped(!isFlipped);
  };

  // Generate activity data for pie chart (mock data if not available)
  const activityData = {
    lectures: parseInt(course.lecture_hours) || 20,
    tutorials: parseInt(course.tutorial_hours) || 10,
    lab: parseInt(course.practical_hours) || 5,
    independent: parseInt(course.independent_hours) || 65
  };

  // Get assessment info - handle multiple possible formats
  let assessmentInfo = {
    written_exam_percent: 0,
    coursework_percent: 0,
    practical_exam_percent: 0,
    full_text: 'Assessment information not provided by DRPS'
  };

  // Check different possible assessment data sources, prioritizing assesment_formatted
  if (course.assesment_formatted) {
    // Parse from formatted assessment string with one 's'
    const examMatch = course.assesment_formatted.match(/Written Exam (\d+) %/);
    const courseworkMatch = course.assesment_formatted.match(/Coursework (\d+) %/);
    const practicalMatch = course.assesment_formatted.match(/Practical Exam (\d+) %/);
    
    assessmentInfo = {
      written_exam_percent: examMatch ? parseInt(examMatch[1]) : 0,
      coursework_percent: courseworkMatch ? parseInt(courseworkMatch[1]) : 0,
      practical_exam_percent: practicalMatch ? parseInt(practicalMatch[1]) : 0,
      full_text: course.assesment_formatted
    };
  } else if (course.assessment_formatted) {
    // Try parse from formatted assessment string with two 's'
    const examMatch = course.assessment_formatted.match(/Written Exam (\d+) %/);
    const courseworkMatch = course.assessment_formatted.match(/Coursework (\d+) %/);
    const practicalMatch = course.assessment_formatted.match(/Practical Exam (\d+) %/);
    
    assessmentInfo = {
      written_exam_percent: examMatch ? parseInt(examMatch[1]) : 0,
      coursework_percent: courseworkMatch ? parseInt(courseworkMatch[1]) : 0,
      practical_exam_percent: practicalMatch ? parseInt(practicalMatch[1]) : 0,
      full_text: course.assessment_formatted
    };
  } else if (course.assesment && typeof course.assesment === 'object') {
    // Standard format from scraper with one 's' (assesment)
    if (course.assesment.full_text) {
      // Access nested full_text if available
      assessmentInfo = {
        ...assessmentInfo,
        ...course.assesment,
        full_text: course.assesment.full_text
      };
    } else {
      assessmentInfo = course.assesment;
    }
  } else if (course.assessment && typeof course.assessment === 'object') {
    // Try with two 's' (assessment) as fallback
    if (course.assessment.full_text) {
      // Access nested full_text if available
      assessmentInfo = {
        ...assessmentInfo,
        ...course.assessment,
        full_text: course.assessment.full_text
      };
    } else {
      assessmentInfo = course.assessment;
    }
  } else if (typeof course.assesment === 'string') {
    // If assesment (one 's') is a string, use it as full_text
    assessmentInfo.full_text = course.assesment;
  } else if (typeof course.assessment === 'string') {
    // If assessment (two 's') is a string, use it as full_text
    assessmentInfo.full_text = course.assessment;
  }

  // If we have additional assessment info fields, use those as well
  if (course.additional_assessment_info) {
    assessmentInfo.full_text += " " + course.additional_assessment_info;
  }

  // Special case: If all assessment values are zero, set appropriate message
  if (assessmentInfo.written_exam_percent === 0 && 
      assessmentInfo.coursework_percent === 0 && 
      assessmentInfo.practical_exam_percent === 0) {
    // Check if the full_text already has content before overriding
    if (assessmentInfo.full_text === 'Assessment information not provided by DRPS' || 
        assessmentInfo.full_text.includes('0 %')) {
      assessmentInfo.full_text = 'No formal exam, coursework-only assessment';
    }
  }

  // Check if there's a meaningful full_text beyond our defaults
  const hasAssessmentInfo = assessmentInfo.full_text !== 'Assessment information not provided by DRPS' && 
                            assessmentInfo.full_text !== 'No formal exam, coursework-only assessment';

  return (
    <div 
      className={`card-container ${isFlipped ? 'flipped' : ''}`}
      style={{ height: '320px' }}
      onClick={handleCardClick}
    >
      <div className="card-flipper">
        {/* Front Side */}
        <div className="card-front p-5 flex flex-col justify-between">
          <div>
            {/* Course Title and Code */}
            <h3 className="text-xl font-bold text-blue-900 mb-1">
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
          </div>
          
          {/* Credits Badge */}
          <div className="flex items-center justify-between mt-auto">
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
              {course.credits || 'N/A'} Credits • Level {displayLevel}
            </span>
            
            {/* Call to action text */}
            <span className="text-blue-600 text-sm hover:text-blue-800">
              Click to see more →
            </span>
          </div>
        </div>

        {/* Back Side */}
        <div className="card-back p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {course.name} <span className="text-sm">({course.code})</span>
            </h3>
            
            {/* Assessment Information */}
            <div className="mb-2">
              <h4 className="text-md font-semibold mb-1">Assessment:</h4>
              {hasAssessmentInfo ? (
                <>
                  <p className="text-sm text-gray-700">
                    {assessmentInfo.full_text || 'Not specified'}
                  </p>
                  <div className="flex flex-wrap mt-1 gap-1">
                    {assessmentInfo.written_exam_percent > 0 && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        Exam {assessmentInfo.written_exam_percent}%
                      </span>
                    )}
                    {assessmentInfo.coursework_percent > 0 && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        Coursework {assessmentInfo.coursework_percent}%
                      </span>
                    )}
                    {assessmentInfo.practical_exam_percent > 0 && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                        Practical {assessmentInfo.practical_exam_percent}%
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-700">
                  {/* Try other possible assessment fields */}
                  {course.assessment_details || course.assessment_method || course.assesment_details || 
                   (course.assessment_formatted && course.assessment_formatted !== "Assessment (Further Info) Written Exam 0 %, Coursework 0 %, Practical Exam 0 %") ? 
                    (course.assessment_details || course.assessment_method || course.assesment_details || course.assessment_formatted) : 
                    "Assessment information not provided by DRPS"}
                </p>
              )}
            </div>
            
            {/* Online Warning */}
            {isOnline && (
              <div className="mb-2 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs inline-block">
                ⚠️ Online Course
              </div>
            )}
            
            {/* Keywords section removed */}
            
            {/* Requirements - only show if there's actual content */}
            {course.pre_requisites && (
              <div className="mb-2">
                <h4 className="text-md font-semibold mb-1">Prerequisites:</h4>
                <p className="text-xs text-gray-700">
                  {course.pre_requisites.trim() === "" ? 
                    "None" : 
                    course.pre_requisites.trim().startsWith("Students MUST have passed") ? 
                      course.pre_requisites : 
                      `Students MUST have passed: ${course.pre_requisites}`}
                </p>
              </div>
            )}
          </div>
          
          {/* Pie Chart Visualization (simplified visual representation) */}
          <div className="mt-auto">
            <h4 className="text-md font-semibold mb-1">Course Activities:</h4>
            <div className="flex items-center space-x-1">
              <div className="h-4 bg-blue-500 rounded-l" style={{ width: `${activityData.lectures}%` }} title={`Lectures: ${activityData.lectures}%`}></div>
              <div className="h-4 bg-green-500" style={{ width: `${activityData.tutorials}%` }} title={`Tutorials: ${activityData.tutorials}%`}></div>
              <div className="h-4 bg-yellow-500" style={{ width: `${activityData.lab}%` }} title={`Lab: ${activityData.lab}%`}></div>
              <div className="h-4 bg-purple-500 rounded-r" style={{ width: `${activityData.independent}%` }} title={`Independent: ${activityData.independent}%`}></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-blue-500">Lectures</span>
              <span className="text-green-500">Tutorials</span>
              <span className="text-yellow-500">Lab</span>
              <span className="text-purple-500">Independent</span>
            </div>
            <div className="text-center text-gray-500 text-xs mt-3">
              Click to flip back
            </div>
          </div>
        </div>
      </div>
      
      {/* Add proper Link for navigation separate from flip behavior */}
      <div className="mt-2 text-center">
        <Link href={`/course/${course.code}`} className="text-blue-600 text-xs hover:text-blue-800 hover:underline">
          View full course details →
        </Link>
      </div>
    </div>
  );
};

export default CourseCard; 