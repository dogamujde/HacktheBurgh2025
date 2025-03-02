console.log(`Processed ${totalProcessed} files, ${totalInvalid} invalid, found ${allCourses.length} courses`);
console.log('Schools checked:', schoolsChecked);

// Apply additional filters to all courses

// Course Level filter
if (courseLevel && typeof courseLevel === 'string') {
  const courseLevelLower = courseLevel.toLowerCase();
  allCourses = allCourses.filter(course => {
    if (course.level && typeof course.level === 'string') {
      const levelLower = course.level.toLowerCase();
      
      if (courseLevelLower === 'undergraduate') {
        // Check for indicators of undergraduate courses
        return levelLower.includes('undergraduate') || 
              levelLower.includes('ug') ||
              (course.code && course.code.match(/[A-Z]{4}[0-4][0-9]{4}/));
      } else if (courseLevelLower === 'postgraduate') {
        // Check for indicators of postgraduate courses
        return levelLower.includes('postgraduate') || 
              levelLower.includes('pg') ||
              (course.code && course.code.match(/[A-Z]{4}[5-9][0-9]{4}/));
      }
    }
    return true;
  });
}

// Visiting Students filter
if (visitingStudents === 'true') {
  allCourses = allCourses.filter(course => {
    if (course.course_description) {
      const desc = course.course_description.toLowerCase();
      return desc.includes('visiting student') || 
             desc.includes('visiting students') ||
             (course.name && course.name.toLowerCase().includes('visiting'));
    }
    return false;
  });
}

// Delivery Method filter - Fixed implementation
if (deliveryMethod && typeof deliveryMethod === 'string') {
  const deliveryMethodLower = deliveryMethod.toLowerCase();
  console.log(`Applying delivery method filter: ${deliveryMethodLower}`);
  
  allCourses = allCourses.filter(course => {
    let hasMatch = false;
    
    // First check delivery field if available
    if (course.delivery && typeof course.delivery === 'string') {
      const deliveryLower = course.delivery.toLowerCase();
      
      // Handle both 'on-campus' and 'in-person' formats
      if (deliveryMethodLower === 'on-campus' || deliveryMethodLower === 'in-person') {
        hasMatch = deliveryLower.includes('campus') || 
                  deliveryLower.includes('in person') || 
                  deliveryLower.includes('on-site') ||
                  deliveryLower.includes('face-to-face');
      } else if (deliveryMethodLower === 'online') {
        hasMatch = deliveryLower.includes('online') || 
                  deliveryLower.includes('remote') || 
                  deliveryLower.includes('distance');
      } else if (deliveryMethodLower === 'hybrid') {
        hasMatch = deliveryLower.includes('hybrid') || 
                  deliveryLower.includes('blended') || 
                  (deliveryLower.includes('online') && deliveryLower.includes('campus'));
      }
      
      if (hasMatch) {
        return true;
      }
    }
    
    // If no match yet, check course name and description
    const name = (course.name || course.title || '').toLowerCase();
    const description = (course.course_description || '').toLowerCase();
    
    // Handle both 'on-campus' and 'in-person' formats
    if (deliveryMethodLower === 'on-campus' || deliveryMethodLower === 'in-person') {
      // Changed logic: only match courses that explicitly mention in-person/on-campus
      // or don't mention any delivery method (default assumption)
      hasMatch = description.includes('on campus') || 
                description.includes('in person') ||
                description.includes('face-to-face') ||
                description.includes('on-site') ||
                // Only assume on-campus as default if absolutely no delivery info
                (!description.includes('online') && 
                 !description.includes('remote') && 
                 !description.includes('distance') && 
                 !description.includes('hybrid') && 
                 !description.includes('blended'));
    } else if (deliveryMethodLower === 'online') {
      hasMatch = name.includes('online') || 
                description.includes('online') || 
                description.includes('remote') ||
                description.includes('distance learning');
    } else if (deliveryMethodLower === 'hybrid') {
      hasMatch = name.includes('hybrid') || 
                description.includes('hybrid') || 
                description.includes('blended') ||
                (description.includes('online') && description.includes('campus'));
    }
    
    return hasMatch;
  });
  
  console.log(`After delivery method filter, found ${allCourses.length} courses`);
}

// If search term is provided, filter by course name, code, and description
if (search) {
  const searchTerms = search.toLowerCase().split(' ').filter(term => term.length > 0);
  console.log(`Applying search filter with terms: ${searchTerms.join(', ')}`);
  
  // First, identify which courses match by name for higher priority
  const coursesWithNameMatch = [];
  const coursesWithOtherMatch = [];
  
  allCourses.forEach(course => {
    const courseName = (course.name || course.title || '').toLowerCase();
    const courseCode = (course.code || '').toLowerCase();
    const courseDesc = (course.course_description || '').toLowerCase();
    
    // Check if all search terms match the course name
    const nameMatches = searchTerms.every(term => courseName.includes(term));
    
    // If name matches, prioritize this course
    if (nameMatches) {
      coursesWithNameMatch.push(course);
    } 
    // Otherwise check if it matches other fields
    else if (
      searchTerms.every(term => 
        courseCode.includes(term) || 
        courseDesc.includes(term)
      )
    ) {
      coursesWithOtherMatch.push(course);
    }
  });
  
  // Only use other matches if there are no name matches
  if (coursesWithNameMatch.length > 0) {
    allCourses = coursesWithNameMatch;
    console.log(`Found ${coursesWithNameMatch.length} courses with name matches, ignoring ${coursesWithOtherMatch.length} other matches`);
  } else {
    allCourses = coursesWithOtherMatch;
    console.log(`No courses with name matches found, using ${coursesWithOtherMatch.length} matches from other fields`);
  }
  
  console.log(`After search filter, found ${allCourses.length} courses`);
}

// Sort courses by popularity (quota) from academic_year field
allCourses.sort((a, b) => {
  // Extract quota values from academic_year field
  const getQuota = (course) => {
    if (course.academic_year && typeof course.academic_year === 'string') {
      // Check if the quota is "None"
      if (course.academic_year.includes('Quota: None')) {
        return -1; // Special value for "None" to sort last
      }
      
      const match = course.academic_year.match(/Quota:\s*(\d+)/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
    return 0; // Default to 0 if no quota found
  };

  const quotaA = getQuota(a);
  const quotaB = getQuota(b);
  
  // Place "None" quota courses last
  if (quotaA === -1 && quotaB === -1) {
    // If both are "None", maintain stable order
    return 0;
  } else if (quotaA === -1) {
    // If A has "None", it goes after B
    return 1;
  } else if (quotaB === -1) {
    // If B has "None", it goes after A
    return -1;
  }

  // Sort in descending order (highest quota first)
  return quotaB - quotaA;
});

console.log('Courses sorted by popularity (quota)');

res.status(200).json({ courses: allCourses });
} catch (error) {
console.error('Error in API route:', error);
res.status(500).json({ error: 'Failed to fetch courses' });
} 