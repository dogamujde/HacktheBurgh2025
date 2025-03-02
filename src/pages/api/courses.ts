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
      return course.course_description.toLowerCase().includes('visiting student') ||
            (course.name && course.name.toLowerCase().includes('visiting student'));
    }
    return false;
  });
}

// Delivery Method filter
if (deliveryMethod && typeof deliveryMethod === 'string') {
  const deliveryMethodLower = deliveryMethod.toLowerCase();
  allCourses = allCourses.filter(course => {
    // First check the delivery field if available
    if (course.delivery && typeof course.delivery === 'string') {
      const deliveryLower = course.delivery.toLowerCase();
      
      if (deliveryMethodLower === 'on-campus') {
        return deliveryLower.includes('campus') || 
             deliveryLower.includes('in person') || 
             !deliveryLower.includes('online');
      } else if (deliveryMethodLower === 'online') {
        return deliveryLower.includes('online') || 
             deliveryLower.includes('remote') || 
             deliveryLower.includes('distance');
      } else if (deliveryMethodLower === 'hybrid') {
        return deliveryLower.includes('hybrid') || 
             deliveryLower.includes('blended') || 
             (deliveryLower.includes('online') && deliveryLower.includes('campus'));
      }
    }
    
    // If no delivery field, check course name and description
    const name = (course.name || course.title || '').toLowerCase();
    const description = (course.course_description || '').toLowerCase();
    
    if (deliveryMethodLower === 'on-campus') {
      return !name.includes('online') || description.includes('on campus');
    } else if (deliveryMethodLower === 'online') {
      return name.includes('online') || description.includes('online');
    } else if (deliveryMethodLower === 'hybrid') {
      return name.includes('hybrid') || description.includes('hybrid') || 
            description.includes('blended');
    }
    
    return true;
  });
}

res.status(200).json({ courses: allCourses });
} catch (error) {
console.error('Error in API route:', error);
res.status(500).json({ error: 'Failed to fetch courses' });
} 