import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
 */
const CourseCard = ({ course }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Add event listener to reset card state when navigating between pages
  useEffect(() => {
    const resetCardState = () => {
      setIsFlipped(false);
    };

    // Listen for the custom reset event
    document.addEventListener('resetCourseCards', resetCardState);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener('resetCourseCards', resetCardState);
    };
  }, []);

  // Handle potential null or undefined course
  if (!course) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 h-64 flex items-center justify-center">
        <p className="text-gray-500">Course information unavailable</p>
      </div>
    );
  }

  // Normalize course properties to handle inconsistencies in data structure
  const courseCode = course.code || '';
  const courseTitle = course.title || course.name || 'Untitled Course';
  const courseDescription = course.course_description || course.description || '';
  const courseCredits = course.credits || 'N/A';
  const coursePeriod = course.period || course.semester || '';
  const courseAvailability = course.availability || 'SV1';
  
  // Check for bullet points in either format (new format 'bulletpoints' or old format 'bullet_points')
  const hasBulletPoints = (course.bulletpoints && course.bulletpoints.trim().length > 0) || 
                          (course.bullet_points && course.bullet_points.trim().length > 0);
  
  // Get the actual bullet points content
  const bulletPointsContent = course.bulletpoints || course.bullet_points || '';
  
  // Parse bullet points from string to array
  const bulletPointsArray = bulletPointsContent ? 
    bulletPointsContent.split('\n').filter(bp => bp.trim()) : [];

  // Safely truncate description to 150 characters if it exists
  const truncatedDescription = courseDescription 
    ? courseDescription.substring(0, 150) + (courseDescription.length > 150 ? '...' : '') 
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

  // Generate activity data from actual course data
  const extractActivityData = () => {
    // Debug: Log course code for tracking
    console.log(`Extracting activities for course: ${courseCode}`);
    
    // Try to find activity data in multiple possible locations in the course object
    const activities = {
      lectures: 0,
      tutorials: 0,
      lab: 0,
      independent: 0
    };
    
    // First check if we have a "learning_activities" field and parse it
    if (course.learning_activities) {
      console.log(`Found learning_activities for ${courseCode}:`, course.learning_activities);
      try {
        // If learning_activities is a string, try to parse it as JSON
        let activitiesData = course.learning_activities;
        if (typeof activitiesData === 'string') {
          // Try to parse the string as JSON
          try {
            activitiesData = JSON.parse(activitiesData);
            console.log(`Successfully parsed JSON for ${courseCode}:`, activitiesData);
          } catch (e) {
            console.log(`Not valid JSON for ${courseCode}, trying regex extraction`);
            // If it's not valid JSON, check if it's a string with hours information
            // Enhanced regex patterns to catch more variations
            const lectureMatch = activitiesData.match(/(?:lecture|lectures|teaching|class)[s]?\s*(?:hours|time)?[:=\s-]+\s*(\d+)/i);
            const tutorialMatch = activitiesData.match(/(?:tutorial|tutorials|seminar|seminars|workshop|workshops)[s]?\s*(?:hours|time)?[:=\s-]+\s*(\d+)/i);
            const labMatch = activitiesData.match(/(?:lab|labs|practical|practicals|fieldwork)[s]?\s*(?:hours|time)?[:=\s-]+\s*(\d+)/i);
            
            // Expanded regex for independent learning to catch "Directed Learning and Independent Learning Hours" variations
            const independentMatch = activitiesData.match(/(?:independent|self[\s-_]study|private|personal|unsupervised|directed(?:\s+learning)?(?:\s+and\s+independent(?:\s+learning)?)?)[s]?\s*(?:hours|time|work|learning)?[:=\s-]+\s*(\d+)/i);
            
            // Also check for total hours in case we need to calculate percentages
            const totalHoursMatch = activitiesData.match(/(?:total\s+hours)[:=\s-]+\s*(\d+)/i);
            
            console.log(`Regex matches for ${courseCode}:`, {
              lectureMatch, tutorialMatch, labMatch, independentMatch, totalHoursMatch
            });
            
            if (lectureMatch) activities.lectures = parseInt(lectureMatch[1]);
            if (tutorialMatch) activities.tutorials = parseInt(tutorialMatch[1]);
            if (labMatch) activities.lab = parseInt(labMatch[1]);
            if (independentMatch) activities.independent = parseInt(independentMatch[1]);
            
            // If we have a total hours specified and independent study isn't found,
            // we can try to calculate it based on the difference
            if (totalHoursMatch && activities.independent === 0) {
              const totalFromText = parseInt(totalHoursMatch[1]);
              const sumOfOthers = activities.lectures + activities.tutorials + activities.lab;
              
              if (totalFromText > sumOfOthers) {
                activities.independent = totalFromText - sumOfOthers;
                console.log(`Calculated independent hours for ${courseCode} from total: ${activities.independent}`);
              }
            }
          }
        }
        
        // If we have parsed JSON or object, extract the values
        if (typeof activitiesData === 'object' && activitiesData !== null) {
          // Map different terms to our activity categories
          const lectureTerms = ['lectures', 'lecture', 'lecture_hours', 'lectureHours', 
                               'scheduled_lecture', 'lecture_scheduled', 'teaching', 'classes',
                               'class_hours', 'classHours', 'teaching_hours', 'teachingHours'];
          
          const tutorialTerms = ['tutorials', 'tutorial', 'tutorial_hours', 'tutorialHours', 
                                'scheduled_tutorial', 'tutorial_scheduled', 'seminars', 'seminar',
                                'workshop', 'workshops', 'seminar_hours', 'seminarHours',
                                'workshop_hours', 'workshopHours'];
          
          const labTerms = ['lab', 'practical', 'lab_hours', 'practical_hours', 
                          'labHours', 'practicalHours', 'scheduled_lab', 'lab_scheduled',
                          'scheduled_practical', 'practical_scheduled', 'fieldwork',
                          'fieldwork_hours', 'fieldworkHours'];
          
          const independentTerms = ['independent', 'self_study', 'independent_hours', 'independentHours',
                                   'self_study_hours', 'selfStudyHours', 'unscheduled', 'unsupervised',
                                   'private_study', 'personal_study', 'privateStudy', 'personalStudy',
                                   'directed_learning_and_independent_learning', 'directed_learning',
                                   'directed_learning_hours', 'directedLearningHours'];
          
          // Look for lecture-type activities
          for (const term of lectureTerms) {
            if (activitiesData[term] !== undefined && !isNaN(parseInt(activitiesData[term]))) {
              activities.lectures = parseInt(activitiesData[term]);
              console.log(`Found lecture hours for ${courseCode} using term '${term}': ${activities.lectures}`);
              break;
            }
          }
          
          // Look for tutorial-type activities
          for (const term of tutorialTerms) {
            if (activitiesData[term] !== undefined && !isNaN(parseInt(activitiesData[term]))) {
              activities.tutorials = parseInt(activitiesData[term]);
              console.log(`Found tutorial hours for ${courseCode} using term '${term}': ${activities.tutorials}`);
              break;
            }
          }
          
          // Look for lab-type activities
          for (const term of labTerms) {
            if (activitiesData[term] !== undefined && !isNaN(parseInt(activitiesData[term]))) {
              activities.lab = parseInt(activitiesData[term]);
              console.log(`Found lab hours for ${courseCode} using term '${term}': ${activities.lab}`);
              break;
            }
          }
          
          // Look for independent-type activities
          for (const term of independentTerms) {
            if (activitiesData[term] !== undefined && !isNaN(parseInt(activitiesData[term]))) {
              activities.independent = parseInt(activitiesData[term]);
              console.log(`Found independent hours for ${courseCode} using term '${term}': ${activities.independent}`);
              break;
            }
          }
          
          // Also check for nested structures
          const checkNestedObject = (obj, path, category) => {
            const parts = path.split('.');
            let current = obj;
            
            for (const part of parts) {
              if (current[part] === undefined) return false;
              current = current[part];
            }
            
            if (!isNaN(parseInt(current))) {
              activities[category] = parseInt(current);
              console.log(`Found ${category} hours for ${courseCode} from nested path '${path}': ${activities[category]}`);
              return true;
            }
            return false;
          };
          
          // Check nested paths if we haven't found values yet
          if (activities.lectures === 0) {
            checkNestedObject(activitiesData, 'scheduled.lecture', 'lectures') || 
            checkNestedObject(activitiesData, 'hours.lecture', 'lectures') ||
            checkNestedObject(activitiesData, 'scheduled.teaching', 'lectures') ||
            checkNestedObject(activitiesData, 'hours.teaching', 'lectures');
          }
          
          if (activities.tutorials === 0) {
            checkNestedObject(activitiesData, 'scheduled.tutorial', 'tutorials') || 
            checkNestedObject(activitiesData, 'hours.tutorial', 'tutorials') ||
            checkNestedObject(activitiesData, 'scheduled.seminar', 'tutorials') ||
            checkNestedObject(activitiesData, 'hours.seminar', 'tutorials') ||
            checkNestedObject(activitiesData, 'scheduled.workshop', 'tutorials') ||
            checkNestedObject(activitiesData, 'hours.workshop', 'tutorials');
          }
          
          if (activities.lab === 0) {
            checkNestedObject(activitiesData, 'scheduled.lab', 'lab') || 
            checkNestedObject(activitiesData, 'hours.lab', 'lab') ||
            checkNestedObject(activitiesData, 'scheduled.practical', 'lab') ||
            checkNestedObject(activitiesData, 'hours.practical', 'lab');
          }
          
          if (activities.independent === 0) {
            checkNestedObject(activitiesData, 'hours.independent', 'independent') || 
            checkNestedObject(activitiesData, 'hours.self_study', 'independent');
          }
        }
      } catch (error) {
        // If any error occurs during parsing, we'll fall back to other methods
        console.error(`Error parsing learning_activities for ${courseCode}:`, error);
      }
    }
    
    // If learning_activities didn't have data, try traditional methods as fallback
    // For lectures
    if (activities.lectures === 0) {
      if (course.lecture_hours !== undefined) {
        activities.lectures = parseInt(course.lecture_hours) || 0;
        console.log(`Found lecture hours for ${courseCode} from lecture_hours: ${activities.lectures}`);
      } else if (course.scheduled_hours?.lecture !== undefined) {
        activities.lectures = parseInt(course.scheduled_hours.lecture) || 0;
        console.log(`Found lecture hours for ${courseCode} from scheduled_hours.lecture: ${activities.lectures}`);
      } else if (course.activities?.lectures !== undefined) {
        activities.lectures = parseInt(course.activities.lectures) || 0;
        console.log(`Found lecture hours for ${courseCode} from activities.lectures: ${activities.lectures}`);
      } else if (course.hours?.lecture !== undefined) {
        activities.lectures = parseInt(course.hours.lecture) || 0;
        console.log(`Found lecture hours for ${courseCode} from hours.lecture: ${activities.lectures}`);
      } else if (course.teaching_hours !== undefined) {
        activities.lectures = parseInt(course.teaching_hours) || 0;
        console.log(`Found lecture hours for ${courseCode} from teaching_hours: ${activities.lectures}`);
      } else if (course.class_hours !== undefined) {
        activities.lectures = parseInt(course.class_hours) || 0;
        console.log(`Found lecture hours for ${courseCode} from class_hours: ${activities.lectures}`);
      }
    }
    
    // For tutorials
    if (activities.tutorials === 0) {
      if (course.tutorial_hours !== undefined) {
        activities.tutorials = parseInt(course.tutorial_hours) || 0;
        console.log(`Found tutorial hours for ${courseCode} from tutorial_hours: ${activities.tutorials}`);
      } else if (course.scheduled_hours?.tutorial !== undefined) {
        activities.tutorials = parseInt(course.scheduled_hours.tutorial) || 0;
        console.log(`Found tutorial hours for ${courseCode} from scheduled_hours.tutorial: ${activities.tutorials}`);
      } else if (course.activities?.tutorials !== undefined) {
        activities.tutorials = parseInt(course.activities.tutorials) || 0;
        console.log(`Found tutorial hours for ${courseCode} from activities.tutorials: ${activities.tutorials}`);
      } else if (course.hours?.tutorial !== undefined) {
        activities.tutorials = parseInt(course.hours.tutorial) || 0;
        console.log(`Found tutorial hours for ${courseCode} from hours.tutorial: ${activities.tutorials}`);
      } else if (course.seminar_hours !== undefined) {
        activities.tutorials = parseInt(course.seminar_hours) || 0;
        console.log(`Found tutorial hours for ${courseCode} from seminar_hours: ${activities.tutorials}`);
      } else if (course.workshop_hours !== undefined) {
        activities.tutorials = parseInt(course.workshop_hours) || 0;
        console.log(`Found tutorial hours for ${courseCode} from workshop_hours: ${activities.tutorials}`);
      }
    }
    
    // For labs/practicals
    if (activities.lab === 0) {
      if (course.practical_hours !== undefined) {
        activities.lab = parseInt(course.practical_hours) || 0;
        console.log(`Found lab hours for ${courseCode} from practical_hours: ${activities.lab}`);
      } else if (course.lab_hours !== undefined) {
        activities.lab = parseInt(course.lab_hours) || 0;
        console.log(`Found lab hours for ${courseCode} from lab_hours: ${activities.lab}`);
      } else if (course.scheduled_hours?.practical !== undefined) {
        activities.lab = parseInt(course.scheduled_hours.practical) || 0;
        console.log(`Found lab hours for ${courseCode} from scheduled_hours.practical: ${activities.lab}`);
      } else if (course.scheduled_hours?.lab !== undefined) {
        activities.lab = parseInt(course.scheduled_hours.lab) || 0;
        console.log(`Found lab hours for ${courseCode} from scheduled_hours.lab: ${activities.lab}`);
      } else if (course.activities?.lab !== undefined) {
        activities.lab = parseInt(course.activities.lab) || 0;
        console.log(`Found lab hours for ${courseCode} from activities.lab: ${activities.lab}`);
      } else if (course.activities?.practical !== undefined) {
        activities.lab = parseInt(course.activities.practical) || 0;
        console.log(`Found lab hours for ${courseCode} from activities.practical: ${activities.lab}`);
      } else if (course.hours?.lab !== undefined) {
        activities.lab = parseInt(course.hours.lab) || 0;
        console.log(`Found lab hours for ${courseCode} from hours.lab: ${activities.lab}`);
      } else if (course.hours?.practical !== undefined) {
        activities.lab = parseInt(course.hours.practical) || 0;
        console.log(`Found lab hours for ${courseCode} from hours.practical: ${activities.lab}`);
      } else if (course.fieldwork_hours !== undefined) {
        activities.lab = parseInt(course.fieldwork_hours) || 0;
        console.log(`Found lab hours for ${courseCode} from fieldwork_hours: ${activities.lab}`);
      }
    }
    
    // For independent study
    if (activities.independent === 0) {
      if (course.independent_hours !== undefined) {
        activities.independent = parseInt(course.independent_hours) || 0;
        console.log(`Found independent hours for ${courseCode} from independent_hours: ${activities.independent}`);
      } else if (course.self_study_hours !== undefined) {
        activities.independent = parseInt(course.self_study_hours) || 0;
        console.log(`Found independent hours for ${courseCode} from self_study_hours: ${activities.independent}`);
      } else if (course.scheduled_hours?.independent !== undefined) {
        activities.independent = parseInt(course.scheduled_hours.independent) || 0;
        console.log(`Found independent hours for ${courseCode} from scheduled_hours.independent: ${activities.independent}`);
      } else if (course.scheduled_hours?.self_study !== undefined) {
        activities.independent = parseInt(course.scheduled_hours.self_study) || 0;
        console.log(`Found independent hours for ${courseCode} from scheduled_hours.self_study: ${activities.independent}`);
      } else if (course.activities?.independent !== undefined) {
        activities.independent = parseInt(course.activities.independent) || 0;
        console.log(`Found independent hours for ${courseCode} from activities.independent: ${activities.independent}`);
      } else if (course.activities?.self_study !== undefined) {
        activities.independent = parseInt(course.activities.self_study) || 0;
        console.log(`Found independent hours for ${courseCode} from activities.self_study: ${activities.independent}`);
      } else if (course.hours?.independent !== undefined) {
        activities.independent = parseInt(course.hours.independent) || 0;
        console.log(`Found independent hours for ${courseCode} from hours.independent: ${activities.independent}`);
      } else if (course.hours?.self_study !== undefined) {
        activities.independent = parseInt(course.hours.self_study) || 0;
        console.log(`Found independent hours for ${courseCode} from hours.self_study: ${activities.independent}`);
      } else if (course.private_study_hours !== undefined) {
        activities.independent = parseInt(course.private_study_hours) || 0;
        console.log(`Found independent hours for ${courseCode} from private_study_hours: ${activities.independent}`);
      } else if (course.personal_study_hours !== undefined) {
        activities.independent = parseInt(course.personal_study_hours) || 0;
        console.log(`Found independent hours for ${courseCode} from personal_study_hours: ${activities.independent}`);
      }
    }
    
    // Calculate total hours
    const totalHours = activities.lectures + activities.tutorials + activities.lab + activities.independent;
    console.log(`Total hours for ${courseCode}: ${totalHours}`, activities);
    
    // If we have no data or total is 0, use some reasonable defaults based on credit value
    if (totalHours === 0) {
      // Estimate based on credits (10 hours per credit is standard)
      const credits = parseInt(courseCredits) || 20;
      const estimatedTotal = credits * 10;
      
      console.log(`No activity data found for ${courseCode}. Using defaults based on ${credits} credits (${estimatedTotal} hours total)`);
      
      // Split using typical ratios for university courses
      const percentages = {
        lectures: 20, // 20% lectures
        tutorials: 10, // 10% tutorials
        lab: 5, // 5% lab work
        independent: 65 // 65% independent study
      };
      
      console.log(`Default percentages for ${courseCode}:`, percentages);
      return percentages;
    }
    
    // Convert hours to percentages - use more precise calculations first
    const rawPercentages = {
      lectures: (activities.lectures / totalHours) * 100,
      tutorials: (activities.tutorials / totalHours) * 100,
      lab: (activities.lab / totalHours) * 100,
      independent: (activities.independent / totalHours) * 100
    };
    
    // Then round them while keeping track of the rounding errors
    let percentages = {
      lectures: Math.round(rawPercentages.lectures),
      tutorials: Math.round(rawPercentages.tutorials),
      lab: Math.round(rawPercentages.lab),
      independent: Math.round(rawPercentages.independent)
    };
    
    // Ensure percentages add up to exactly 100%
    const totalPercentage = percentages.lectures + percentages.tutorials + percentages.lab + percentages.independent;
    
    if (totalPercentage !== 100) {
      console.log(`Adjusting percentages for ${courseCode}: total was ${totalPercentage}%`);
      
      // Find the largest value to adjust (based on raw percentages to preserve proportions)
      const largestKey = Object.keys(rawPercentages).reduce((a, b) => 
        rawPercentages[a] > rawPercentages[b] ? a : b
      );
      
      // Adjust the largest value to make total 100%
      percentages[largestKey] += (100 - totalPercentage);
      console.log(`Adjusted ${largestKey} by ${100 - totalPercentage} to make total 100%`);
    }
    
    // Final validation - just to be absolutely certain we have 100%
    const finalTotal = percentages.lectures + percentages.tutorials + percentages.lab + percentages.independent;
    if (finalTotal !== 100) {
      console.error(`Error: Percentages for ${courseCode} still don't add up to 100% (${finalTotal}%)`);
      // Force correction on independent study as a last resort
      percentages.independent += (100 - finalTotal);
    }
    
    console.log(`Final percentages for ${courseCode}:`, percentages);
    return percentages;
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
          href={getPathURL(courseCode, courseAvailability, coursePeriod)}
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