import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCompare } from './CompareContext';

// Format the period value for use in the PATH.is URL
const formatPeriodForURL = (period) => {
  if (!period) return "";
  return period
    .replace("Semester 1", "SEM1")
    .replace("Semester 2", "SEM2")
    .replace("Full Year", "YR") // Full Year should be "YR"
    .replace(/\s+/g, ""); // Remove any spaces
};

// Construct the official course URL for PATH
const getPathURL = (courseCode, availability, period) => {
  if (!courseCode) return "#";
  const formattedPeriod = formatPeriodForURL(period);
  // Use availability or default to SV1 if not available
  const formattedAvailability = availability || "SV1";
  return `https://path.is.ed.ac.uk/courses/${courseCode}_${formattedAvailability}_${formattedPeriod}`;
};

/**
 * CourseCard component displays a course in a card format with flip animation
 * @param {Object} course - The course object containing details
 * @param {string} courseCode - The course code (alternative to providing full course object)
 * @param {boolean} enableFlipping - Whether to enable flipping regardless of compare mode
 * @param {boolean} inCompareOverlay - Whether the card is being displayed in the compare overlay
 */
const CourseCard = ({ course, courseCode: propCourseCode, enableFlipping, inCompareOverlay }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [courseData, setCourseData] = useState(course);
  const [isLoading, setIsLoading] = useState(!course && propCourseCode);
  // Import the compare context
  const { compareMode, selectedCards, selectCard } = useCompare();

  // If courseCode prop is provided but no course object, fetch the course data
  useEffect(() => {
    const fetchCourse = async () => {
      if (propCourseCode && !course) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/course?code=${propCourseCode}`);
          if (response.ok) {
            const data = await response.json();
            setCourseData(data);
          } else {
            console.error('Failed to fetch course data');
          }
        } catch (error) {
          console.error('Error fetching course:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCourse();
  }, [propCourseCode, course]);

  // Add event listener to reset card state when navigating between pages
  useEffect(() => {
    const resetCardState = () => {
      setIsFlipped(false);
    };

    // Listen for the custom reset event
    document.addEventListener('resetCourseCards', resetCardState);

    // Clean up on unmount
    return () => {
      document.removeEventListener('resetCourseCards', resetCardState);
    };
  }, []);

  // Extract course details
  const courseCode = propCourseCode || (courseData?.code || '');
  const courseTitle = courseData?.name || courseData?.course_name || '';
  const courseDescription = courseData?.course_description || courseData?.summary || '';
  const courseCredits = courseData?.credits || '';
  const courseLevel = courseData?.level || '';
  const deliveryPeriod = courseData?.period || '';
  const schoolName = courseData?.school || courseData?.school_name || '';
  const coursePeriod = courseData?.period || courseData?.delivery_period || 'Unknown period';
  
  // Check if the card is selected for comparison
  const isSelected = compareMode && selectedCards.includes(courseCode);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="card-container" style={{ height: '320px', border: '1px solid #e5e7eb' }}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center space-y-4 w-full p-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2 w-full">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where data isn't available
  if (!courseData && !isLoading) {
    return (
      <div className="card-container" style={{ height: '320px', border: '1px solid #e5e7eb' }}>
        <div className="w-full h-full flex items-center justify-center p-4">
          <p className="text-gray-500 text-center">Course information not available</p>
        </div>
      </div>
    );
  }

  // Check for bullet points in either format (new format 'bulletpoints' or old format 'bullet_points')
  const hasBulletPoints = (courseData?.bulletpoints && courseData.bulletpoints.trim().length > 0) || 
                          (courseData?.bullet_points && courseData.bullet_points.trim().length > 0);
  
  // Get the actual bullet points content
  const bulletPointsContent = courseData?.bulletpoints || courseData?.bullet_points || '';
  
  // Parse bullet points from string to array
  const bulletPointsArray = bulletPointsContent ? 
    bulletPointsContent.split('\n').filter(bp => bp.trim()) : [];

  // Safely truncate description to 150 characters if it exists
  const truncatedDescription = courseDescription 
    ? courseDescription.substring(0, 150) + (courseDescription.length > 150 ? '...' : '') 
    : 'No description available';

  // Determine the course level from credit_level or other properties
  const fullLevelInfo = courseData?.credit_level || courseData?.level || courseData?.scqf_level || '';
  
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
  
  // Extract the year information if available
  let displayYear = null;
  if (fullLevelInfo) {
    // Try to extract year from formats like "SCQF Level 8 (Year 2 Undergraduate)"
    const yearMatch = fullLevelInfo.match(/Year (\d+)/i);
    if (yearMatch && yearMatch[1]) {
      displayYear = yearMatch[1];
    }
  }

  // Check if course is online
  const isOnline = courseData?.delivery_method?.toLowerCase().includes('online') || 
                  courseData?.period?.toLowerCase().includes('online') ||
                  courseData?.summary?.toLowerCase().includes('online') ||
                  courseData?.course_description?.toLowerCase().includes('online delivery');

  // Modified handle card click to account for compare mode
  const handleCardClick = (e) => {
    // Prevent navigation when clicking the card
    e.preventDefault();
    
    // When in the CompareOverlay, only flip behavior is allowed
    if (inCompareOverlay) {
      setIsFlipped(!isFlipped);
      return;
    }
    
    // Check if we're in compare mode but not in the overlay
    if (compareMode) {
      // If card is already selected for comparison, allow flipping
      if (selectedCards.includes(courseCode)) {
        setIsFlipped(!isFlipped);
      } else {
        // If card is not selected, select it for comparison (no flipping)
        selectCard(courseCode);
      }
    } else {
      // Normal mode - respect the enableFlipping prop
      // We should still check enableFlipping as it might be used for other purposes
      if (enableFlipping) {
        setIsFlipped(!isFlipped);
      }
    }
  };

  // Extracts activity data (lecture hours, tutorial hours, etc.) from the course
  const extractActivityData = () => {
    const activities = {
      lectureHours: 0,
      tutorialHours: 0,
      labHours: 0,
      independentHours: 0
    };

    // Check multiple paths to find activities
    try {
      // First try learning_activities from DRPS
      if (courseData?.learning_activities) {
        // Different formats of learning_activities
        if (typeof courseData.learning_activities === 'string') {
          // Parse string format
          const lectureMatch = courseData.learning_activities.match(/Lecture:\s*(\d+(?:\.\d+)?)\s*hours/i);
          const tutorialMatch = courseData.learning_activities.match(/Tutorial:\s*(\d+(?:\.\d+)?)\s*hours/i);
          const labMatch = courseData.learning_activities.match(/Laboratory:\s*(\d+(?:\.\d+)?)\s*hours/i);
          const independentMatch = courseData.learning_activities.match(/Independent Study:\s*(\d+(?:\.\d+)?)\s*hours/i);
          
          activities.lectureHours = lectureMatch ? parseFloat(lectureMatch[1]) : 0;
          activities.tutorialHours = tutorialMatch ? parseFloat(tutorialMatch[1]) : 0;
          activities.labHours = labMatch ? parseFloat(labMatch[1]) : 0;
          activities.independentHours = independentMatch ? parseFloat(independentMatch[1]) : 0;
        } else if (typeof courseData.learning_activities === 'object') {
          // Parse object format
          activities.lectureHours = parseFloat(courseData.learning_activities.lecture_hours || 0);
          activities.tutorialHours = parseFloat(courseData.learning_activities.tutorial_hours || 0);
          activities.labHours = parseFloat(courseData.learning_activities.lab_hours || 0);
          activities.independentHours = parseFloat(courseData.learning_activities.independent_study_hours || 0);
        }
      } 
      // Fallback to individual properties
      else {
        activities.lectureHours = parseFloat(courseData?.lecture_hours || 0);
        activities.tutorialHours = parseFloat(courseData?.tutorial_hours || 0);
        activities.labHours = parseFloat(courseData?.lab_hours || 0);
        activities.independentHours = parseFloat(courseData?.independent_study_hours || 0);
      }
    } catch (error) {
      console.error('Error parsing learning activities:', error);
    }

    return activities;
  };

  // Get activity data for THIS SPECIFIC COURSE instance - ensures unique graph per course
  const activityData = React.useMemo(() => extractActivityData(), [courseCode]);

  // Get assessment info - handle multiple possible formats
  let assessmentInfo = {
    written_exam_percent: 0,
    coursework_percent: 0,
    practical_exam_percent: 0,
    full_text: 'Assessment information not provided by DRPS'
  };

  // Check different possible assessment data sources, prioritizing assesment_formatted
  if (courseData?.assesment_formatted) {
    // Parse from formatted assessment string with one 's'
    const examMatch = courseData.assesment_formatted.match(/Written Exam (\d+) %/);
    const courseworkMatch = courseData.assesment_formatted.match(/Coursework (\d+) %/);
    const practicalMatch = courseData.assesment_formatted.match(/Practical Exam (\d+) %/);
    
    assessmentInfo = {
      written_exam_percent: examMatch ? parseInt(examMatch[1]) : 0,
      coursework_percent: courseworkMatch ? parseInt(courseworkMatch[1]) : 0,
      practical_exam_percent: practicalMatch ? parseInt(practicalMatch[1]) : 0,
      full_text: courseData.assesment_formatted
    };
  } else if (courseData?.assessment_formatted) {
    // Try parse from formatted assessment string with two 's'
    const examMatch = courseData.assessment_formatted.match(/Written Exam (\d+) %/);
    const courseworkMatch = courseData.assessment_formatted.match(/Coursework (\d+) %/);
    const practicalMatch = courseData.assessment_formatted.match(/Practical Exam (\d+) %/);
    
    assessmentInfo = {
      written_exam_percent: examMatch ? parseInt(examMatch[1]) : 0,
      coursework_percent: courseworkMatch ? parseInt(courseworkMatch[1]) : 0,
      practical_exam_percent: practicalMatch ? parseInt(practicalMatch[1]) : 0,
      full_text: courseData.assessment_formatted
    };
  } else if (courseData?.assesment && typeof courseData.assesment === 'object') {
    // Standard format from scraper with one 's' (assesment)
    if (courseData.assesment.full_text) {
      // Access nested full_text if available
      assessmentInfo = {
        ...assessmentInfo,
        ...courseData.assesment,
        full_text: courseData.assesment.full_text
      };
    } else {
      assessmentInfo = courseData.assesment;
    }
  } else if (courseData?.assessment && typeof courseData.assessment === 'object') {
    // Try with two 's' (assessment) as fallback
    if (courseData.assessment.full_text) {
      // Access nested full_text if available
      assessmentInfo = {
        ...assessmentInfo,
        ...courseData.assessment,
        full_text: courseData.assessment.full_text
      };
    } else {
      assessmentInfo = courseData.assessment;
    }
  } else if (typeof courseData.assesment === 'string') {
    // If assesment (one 's') is a string, use it as full_text
    assessmentInfo.full_text = courseData.assesment;
  } else if (typeof courseData.assessment === 'string') {
    // If assessment (two 's') is a string, use it as full_text
    assessmentInfo.full_text = courseData.assessment;
  }

  // If we have additional assessment info fields, use those as well
  if (courseData?.additional_assessment_info) {
    assessmentInfo.full_text += " " + courseData.additional_assessment_info;
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
  
  // Check if there's assessment percentage data to display in the pie chart
  const hasAssessmentPercentages = assessmentInfo.written_exam_percent > 0 || 
                                  assessmentInfo.coursework_percent > 0 || 
                                  assessmentInfo.practical_exam_percent > 0;
  
  // Generate the conic gradient for the pie chart
  const generatePieChartGradient = () => {
    const written = assessmentInfo.written_exam_percent;
    const coursework = assessmentInfo.coursework_percent;
    const practical = assessmentInfo.practical_exam_percent;
    
    // Calculate start and end angles for each segment
    let segments = [];
    let currentAngle = 0;
    
    if (written > 0) {
      const writtenAngle = (written / 100) * 360;
      segments.push({
        start: currentAngle,
        end: currentAngle + writtenAngle,
        color: '#3b82f6' // Blue for written exams
      });
      currentAngle += writtenAngle;
    }
    
    if (coursework > 0) {
      const courseworkAngle = (coursework / 100) * 360;
      segments.push({
        start: currentAngle,
        end: currentAngle + courseworkAngle,
        color: '#ef4444' // Red for coursework
      });
      currentAngle += courseworkAngle;
    }
    
    if (practical > 0) {
      const practicalAngle = (practical / 100) * 360;
      segments.push({
        start: currentAngle,
        end: currentAngle + practicalAngle,
        color: '#22c55e' // Green for practical exams
      });
    }
    
    // Create the conic gradient string
    if (segments.length === 0) return 'conic-gradient(#e5e7eb 0deg, #e5e7eb 360deg)'; // Empty gray circle
    
    let gradientString = 'conic-gradient(';
    segments.forEach((segment, index) => {
      gradientString += `${segment.color} ${segment.start}deg, ${segment.color} ${segment.end}deg`;
      if (index < segments.length - 1) {
        gradientString += ', ';
      }
    });
    gradientString += ')';
    
    return gradientString;
  };

  return (
    <div 
      className={`card-container ${isFlipped ? 'flipped' : ''} 
                 ${compareMode ? 'compare-mode' : ''} 
                 ${isSelected ? 'selected-for-compare' : ''}`}
      style={{ 
        height: '320px',
        border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        boxShadow: isSelected ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : ''
      }}
      onClick={handleCardClick}
    >
      <div className="card-flipper">
        {/* Front Side */}
        <div className="card-front p-5 flex flex-col justify-between">
          {/* Compare Mode Indicator - Only show when in compare mode */}
          {compareMode && (
            <div className="absolute top-2 right-2 z-10">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center 
                              ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                {isSelected ? '✓' : '+'}
              </div>
            </div>
          )}
          
          <div>
            {/* Course Title and Code */}
            <h3 className="text-xl font-bold text-blue-900 mb-1">
              {courseTitle} <span className="font-normal">({courseCode})</span>
            </h3>
            
            {/* Semester and school info */}
            <p className="text-sm text-gray-500 mb-3">
              {coursePeriod || 'No semester info'} • {course.school_name || 'Unknown School'}
            </p>
            
            {/* Display Bullet Points if available, otherwise show description */}
            {hasBulletPoints ? (
              <div className="text-gray-700 mb-4">
                <ul className="space-y-1 text-sm">
                  {bulletPointsArray.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2 font-bold">•</span>
                      <span>{point.startsWith('•') ? point.substring(1).trim() : point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-700 mb-4 text-sm">
                {truncatedDescription}
              </p>
            )}
          </div>
          
          {/* Credits Badge */}
          <div className="flex items-center justify-between mt-auto">
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
              {courseCredits} Credits • Level {displayLevel}
              {displayYear && ` • Year ${displayYear}`}
            </span>
            
            {/* Call to action text - different based on mode */}
            <span className="text-blue-600 text-sm hover:text-blue-800">
              {compareMode 
                ? (isSelected ? 'Selected for compare' : 'Click to select') 
                : 'Click to see more →'}
            </span>
          </div>
        </div>

        {/* Back Side */}
        <div className="card-back p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {courseTitle} <span className="text-sm">({courseCode})</span>
            </h3>
            
            {/* Assessment Information */}
            <div className="mb-2">
              <h4 className="text-md font-semibold mb-1">Assessment:</h4>
              {hasAssessmentInfo ? (
                <>
                  <p className="text-sm text-gray-700">
                    {assessmentInfo.full_text || 'Not specified'}
                  </p>
                  
                  {/* Assessment Percentages as Tags */}
                  <div className="flex flex-wrap mt-1 gap-1">
                    {assessmentInfo.written_exam_percent > 0 && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        Exam {assessmentInfo.written_exam_percent}%
                      </span>
                    )}
                    {assessmentInfo.coursework_percent > 0 && (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                        Coursework {assessmentInfo.coursework_percent}%
                      </span>
                    )}
                    {assessmentInfo.practical_exam_percent > 0 && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        Practical {assessmentInfo.practical_exam_percent}%
                      </span>
                    )}
                  </div>
                  
                  {/* Assessment Pie Chart - Make sure it's visible */}
                  {hasAssessmentPercentages && (
                    <div className="mt-3 mb-2">
                      <div className="flex items-center justify-center">
                        <div 
                          className="w-20 h-20 rounded-full border border-gray-200 overflow-hidden" 
                          style={{ 
                            background: generatePieChartGradient(),
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-center text-xs mt-2 gap-2">
                        {assessmentInfo.written_exam_percent > 0 && (
                          <span className="flex items-center">
                            <span className="w-3 h-3 inline-block bg-blue-500 rounded-full mr-1"></span>
                            Exam
                          </span>
                        )}
                        {assessmentInfo.coursework_percent > 0 && (
                          <span className="flex items-center">
                            <span className="w-3 h-3 inline-block bg-red-500 rounded-full mr-1"></span>
                            Coursework
                          </span>
                        )}
                        {assessmentInfo.practical_exam_percent > 0 && (
                          <span className="flex items-center">
                            <span className="w-3 h-3 inline-block bg-green-500 rounded-full mr-1"></span>
                            Practical
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-700">
                  {/* Try other possible assessment fields */}
                  {courseData?.assessment_details || courseData?.assessment_method || courseData?.assesment_details || 
                   (courseData?.assessment_formatted && courseData?.assessment_formatted !== "Assessment (Further Info) Written Exam 0 %, Coursework 0 %, Practical Exam 0 %") ? 
                    (courseData?.assessment_details || courseData?.assessment_method || courseData?.assesment_details || courseData?.assessment_formatted) : 
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
            
            {/* Requirements - only show if there's actual content */}
            {courseData?.pre_requisites && (
              <div className="mb-2">
                <h4 className="text-md font-semibold mb-1">Prerequisites:</h4>
                <p className="text-xs text-gray-700">
                  {courseData.pre_requisites.trim() === "" ? 
                    "None" : 
                    courseData.pre_requisites.trim().startsWith("Students MUST have passed") ? 
                      courseData.pre_requisites : 
                      `Students MUST have passed: ${courseData.pre_requisites}`}
                </p>
              </div>
            )}
          </div>
          
          {/* Pie Chart Visualization (simplified visual representation) */}
          <div className="mt-auto">
            <h4 className="text-md font-semibold mb-1">Course Activities:</h4>
            {/* Activity bars with percentage widths */}
            <div className="flex items-center space-x-1">
              <div className="h-4 bg-blue-500 rounded-l" 
                style={{ width: `${activityData.lectures}%`, minWidth: activityData.lectures > 0 ? '8px' : '0' }} 
                title={`Lectures: ${activityData.lectures}%`}>
              </div>
              <div className="h-4 bg-green-500" 
                style={{ width: `${activityData.tutorials}%`, minWidth: activityData.tutorials > 0 ? '8px' : '0' }} 
                title={`Tutorials: ${activityData.tutorials}%`}>
              </div>
              <div className="h-4 bg-yellow-500" 
                style={{ width: `${activityData.lab}%`, minWidth: activityData.lab > 0 ? '8px' : '0' }} 
                title={`Lab: ${activityData.lab}%`}>
              </div>
              <div className="h-4 bg-purple-500 rounded-r" 
                style={{ width: `${activityData.independent}%`, minWidth: activityData.independent > 0 ? '8px' : '0' }} 
                title={`Independent: ${activityData.independent}%`}>
              </div>
            </div>
            {/* Activity labels with percentages */}
            <div className="flex justify-between text-xs mt-1">
              <span className={`${activityData.lectures > 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                {activityData.lectures}% Lectures
              </span>
              <span className={`${activityData.tutorials > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                {activityData.tutorials}% Tutorials
              </span>
              <span className={`${activityData.lab > 0 ? 'text-yellow-500' : 'text-gray-400'}`}>
                {activityData.lab}% Lab
              </span>
              <span className={`${activityData.independent > 0 ? 'text-purple-500' : 'text-gray-400'}`}>
                {activityData.independent}% Independent
              </span>
            </div>
            <div className="text-center text-gray-500 text-xs mt-3">
              Click to flip back
            </div>
          </div>
        </div>
      </div>
      
      {/* Add proper Link for navigation separate from flip behavior */}
      <div className="mt-2 text-center">
        <a 
          href={getPathURL(courseCode, courseData?.availability, courseData?.period)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 text-xs hover:text-blue-800 hover:underline flex items-center justify-center"
          onClick={(e) => e.stopPropagation()} // Prevent card flip when clicking the link
        >
          View on PATH
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default CourseCard; 