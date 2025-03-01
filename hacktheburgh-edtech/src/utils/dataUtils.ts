import { Course, Subject, School, College } from '../services/api';

/**
 * Groups courses by a specific property
 */
export function groupCoursesByProperty(
  courses: Course[],
  property: keyof Course
): Record<string, Course[]> {
  return courses.reduce((acc, course) => {
    const key = course[property] as string;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(course);
    return acc;
  }, {} as Record<string, Course[]>);
}

/**
 * Filters courses based on multiple criteria
 */
export function filterCourses(
  courses: Course[],
  filters: {
    college?: string;
    school?: string;
    subject?: string;
    search?: string;
    availability?: string;
    period?: string;
    creditLevel?: string;
  }
): Course[] {
  return courses.filter(course => {
    // Check each filter
    if (filters.college && !course.college.toLowerCase().includes(filters.college.toLowerCase())) {
      return false;
    }
    
    if (filters.school && !course.school_name.toLowerCase().includes(filters.school.toLowerCase())) {
      return false;
    }
    
    if (filters.subject && !course.subject.toLowerCase().includes(filters.subject.toLowerCase())) {
      return false;
    }
    
    if (filters.availability && course.availability !== filters.availability) {
      return false;
    }
    
    if (filters.period && course.period !== filters.period) {
      return false;
    }
    
    if (filters.creditLevel && course.credit_level !== filters.creditLevel) {
      return false;
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesName = course.name.toLowerCase().includes(searchTerm);
      const matchesCode = course.code.toLowerCase().includes(searchTerm);
      const matchesDescription = course.course_description 
        ? course.course_description.toLowerCase().includes(searchTerm)
        : false;
        
      if (!matchesName && !matchesCode && !matchesDescription) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Gets unique values for a specific property across all courses
 */
export function getUniquePropertyValues<T extends keyof Course>(
  courses: Course[],
  property: T
): Course[T][] {
  const values = new Set<Course[T]>();
  
  courses.forEach(course => {
    if (course[property] !== undefined) {
      values.add(course[property]);
    }
  });
  
  return Array.from(values);
}

/**
 * Sorts courses by a specific property
 */
export function sortCourses(
  courses: Course[],
  property: keyof Course,
  direction: 'asc' | 'desc' = 'asc'
): Course[] {
  return [...courses].sort((a, b) => {
    const valueA = a[property];
    const valueB = b[property];
    
    if (valueA === valueB) return 0;
    
    if (valueA === undefined) return direction === 'asc' ? -1 : 1;
    if (valueB === undefined) return direction === 'asc' ? 1 : -1;
    
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return direction === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
    
    return direction === 'asc'
      ? (valueA < valueB ? -1 : 1)
      : (valueA < valueB ? 1 : -1);
  });
} 