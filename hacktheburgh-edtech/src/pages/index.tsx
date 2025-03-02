import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SearchBar from '../components/SearchBar';
import CourseCard from '../components/CourseCard';
import Pagination from '../components/Pagination';

// Updated types to match the actual data structure
type College = {
  name: string;
  schools_count: number;
};

type School = {
  name: string;
  url: string;
  college: string;
  schedule: string;
  code: string;
};

type CollegeWithSchools = {
  name: string;
  schools: School[];
};

// Course type definition
type Course = {
  code: string;
  name: string;
  period: string;
  school_name: string;
  course_description: string;
  credits: string;
  level: string;
};

export default function Home() {
  const [collegesWithSchools, setCollegesWithSchools] = useState<CollegeWithSchools[]>([]);
  const [filteredColleges, setFilteredColleges] = useState<CollegeWithSchools[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [showCourseCards, setShowCourseCards] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 3;
  
  // Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  
  // New state for advanced filters
  const [activeFilters, setActiveFilters] = useState({
    searchTerm: '',
    schools: [],
    subjects: [],
    creditLevels: [],
    credits: { min: '0', max: '120' },
    years: [],
    courseLevel: '',
    visitingStudents: false,
    deliveryMethod: '',
    showUnavailableCourses: false
  });
  
  // Filter courses based on the active filters
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch colleges
        const collegesResponse = await fetch('/api/colleges');
        if (!collegesResponse.ok) {
          throw new Error(`Error fetching colleges: ${collegesResponse.status}`);
        }
        const collegesData = await collegesResponse.json();
        
        if (!collegesData.colleges) {
          throw new Error('No colleges data found');
        }
        
        // Fetch all schools data
        const schoolsResponse = await fetch('/api/subjects');
        if (!schoolsResponse.ok) {
          throw new Error(`Error fetching schools: ${schoolsResponse.status}`);
        }
        const schoolsData = await schoolsResponse.json();
        
        // Fetch all courses data
        const coursesResponse = await fetch('/api/courses');
        if (!coursesResponse.ok) {
          throw new Error(`Error fetching courses: ${coursesResponse.status}`);
        }
        const coursesData = await coursesResponse.json();
        
        // Set courses data
        setCourses(coursesData.courses || []);
        // Initialize filtered courses with all courses
        setFilteredCourses(coursesData.courses || []);
        
        // Group schools by college
        const collegesMap = new Map<string, School[]>();
        
        // Initialize the map with college names
        collegesData.colleges.forEach((college: College) => {
          collegesMap.set(college.name, []);
        });
        
        // Add schools to their respective colleges
        schoolsData.forEach((school: School) => {
          const collegeSchools = collegesMap.get(school.college) || [];
          // Avoid duplicate schools
          if (!collegeSchools.some(s => s.name === school.name)) {
            collegeSchools.push(school);
            collegesMap.set(school.college, collegeSchools);
          }
        });
        
        // Convert the map to an array of CollegeWithSchools
        const result: CollegeWithSchools[] = Array.from(collegesMap.entries()).map(([name, schools]) => ({
          name,
          schools
        }));
        
        setCollegesWithSchools(result);
        setFilteredColleges(result);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle search and filter changes
  useEffect(() => {
    if (collegesWithSchools.length === 0) return;
    
    let filtered = [...collegesWithSchools];
    
    // Filter by search term
    if (activeFilters.searchTerm) {
      filtered = filtered.map(college => {
        const filteredSchools = college.schools.filter(school => 
          school.name.toLowerCase().includes(activeFilters.searchTerm.toLowerCase())
        );
        return { ...college, schools: filteredSchools };
      }).filter(college => college.schools.length > 0);
    }
    
    // Filter by selected schools (multiple)
    if (activeFilters.schools.length > 0) {
      filtered = filtered.map(college => {
        const filteredSchools = college.schools.filter(school => 
          activeFilters.schools.includes(school.name)
        );
        return { ...college, schools: filteredSchools };
      }).filter(college => college.schools.length > 0);
    }
    
    setFilteredColleges(filtered);
    
    // Update search term and selected schools from activeFilters
    setSearchTerm(activeFilters.searchTerm);
    setSelectedSchools(activeFilters.schools);
    
    // Reset to first page when filters change
    setCurrentPage(1);
    
    // Filter courses based on all active filters
    filterCourses();
  }, [collegesWithSchools, activeFilters]);

  // Effect to fetch courses when year filter or other advanced filters change
  useEffect(() => {
    const fetchFilteredCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Prepare API URL with filters
        const params = new URLSearchParams();
        
        // Add school filters if selected
        if (activeFilters.schools.length > 0) {
          // Check if schools are strings or objects with name property
          const schoolNames = activeFilters.schools.map(s => 
            typeof s === 'string' ? s : (s && s.name ? s.name : '')
          ).filter(Boolean);
          
          if (schoolNames.length > 0) {
            params.append('schools', schoolNames.join(','));
            console.log('Sending schools to API:', schoolNames.join(','));
          }
        }
        
        // Add search term if present
        if (activeFilters.searchTerm) {
          params.append('search', activeFilters.searchTerm);
        }
        
        // Add other filters as needed
        if (activeFilters.years.length > 0) {
          params.append('years', activeFilters.years.join(','));
        }
        
        // Add credit levels if present
        if (activeFilters.creditLevels && activeFilters.creditLevels.length > 0) {
          params.append('creditLevels', activeFilters.creditLevels.join(','));
          console.log('Filtering by SCQF credit levels:', activeFilters.creditLevels.join(','));
        }
        
        // Add courseLevel if present
        if (activeFilters.courseLevel) {
          params.append('courseLevel', activeFilters.courseLevel);
          console.log('Filtering by course level:', activeFilters.courseLevel);
        }
        
        // Add showUnavailableCourses parameter if true
        if (activeFilters.showUnavailableCourses) {
          params.append('showUnavailableCourses', 'true');
          console.log('Including unavailable courses in API request');
        }
        
        // Add visitingStudents parameter if true
        if (activeFilters.visitingStudents) {
          params.append('visitingStudents', 'true');
          console.log('Filtering for visiting student courses in API request');
        }
        
        // Add deliveryMethod if present
        if (activeFilters.deliveryMethod) {
          params.append('deliveryMethod', activeFilters.deliveryMethod);
          console.log('Filtering by delivery method:', activeFilters.deliveryMethod);
        }
        
        const requestUrl = `/api/courses?${params.toString()}`;
        console.log('Requesting courses from:', requestUrl);
        
        const response = await fetch(requestUrl);
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.courses) {
          console.error('API response missing courses array:', data);
          setError('Failed to load courses: Invalid API response format');
          setFilteredCourses([]);
          setLoading(false);
          return;
        }
        
        console.log(`Received ${data.courses.length} courses from API`);
        
        // Apply client-side filtering for any filters not handled by the API
        let filtered = data.courses;
        
        // Additional client-side filtering if needed
        filtered = filterCourses(filtered);
        
        setTotalResults(filtered.length);
        setFilteredCourses(filtered);
        
        // Reset to first page when filters change
        setCurrentPage(1);
      } catch (error) {
        console.error('Error fetching filtered courses:', error);
        setError('Failed to load courses. Please try again later.');
        setFilteredCourses([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch from API when specific filters are applied and we have courses
    if (courses.length > 0 && (
      activeFilters.years.length > 0 || 
      activeFilters.searchTerm || 
      activeFilters.schools.length > 0 ||
      activeFilters.showUnavailableCourses ||
      activeFilters.courseLevel
    )) {
      fetchFilteredCourses();
    } else if (courses.length > 0) {
      // Apply filters client-side for other cases
      const filtered = filterCourses();
      setTotalResults(filtered.length);
      setFilteredCourses(filtered);
      setLoading(false);
    }
  }, [activeFilters, courses]);
  
  // Function to filter courses based on all active filters
  const filterCourses = useCallback((coursesToFilter = null) => {
    // If courses are not passed, return empty array if there are no courses in state
    if (!coursesToFilter && (!courses || courses.length === 0)) return [];
    
    // Make a copy of the courses array
    let filteredCourses = [...(coursesToFilter || courses)];
    
    console.log(`Filtering ${filteredCourses.length} courses`);
    
    // Filter based on the search term
    if (activeFilters.searchTerm) {
      const searchTermLower = activeFilters.searchTerm.toLowerCase();
      filteredCourses = filteredCourses.filter(course => {
        // First, check if the course has a name and description
        if (!course.name) return false;
        
        // Then check if the search term appears in the name, course code, or description
        return course.name.toLowerCase().includes(searchTermLower) || 
               (course.code && course.code.toLowerCase().includes(searchTermLower)) || 
               (course.course_description && course.course_description.toLowerCase().includes(searchTermLower));
      });
      console.log(`After search term filter: ${filteredCourses.length} courses`);
    }
    
    // Filter out unavailable courses unless showUnavailableCourses is true
    if (!activeFilters.showUnavailableCourses) {
      filteredCourses = filteredCourses.filter(course => 
        !course.period || course.period !== "Not delivered this year"
      );
      console.log(`After availability filter: ${filteredCourses.length} courses`);
    }
    
    // Filter based on schools
    if (activeFilters.schools && activeFilters.schools.length > 0) {
      filteredCourses = filteredCourses.filter(course => {
        if (!course.school_name && !course.school) return false;
        
        const schoolName = course.school_name || course.school;
        return activeFilters.schools.some(s => {
          // Handle both string and object school values
          const schoolFilter = typeof s === 'string' ? s : (s && s.name ? s.name : '');
          if (!schoolFilter) return false;
          
          return schoolName.toLowerCase().includes(schoolFilter.toLowerCase());
        });
      });
      console.log(`After schools filter: ${filteredCourses.length} courses`);
    }
    
    // Filter based on subjects
    if (activeFilters.subjects && activeFilters.subjects.length > 0) {
      filteredCourses = filteredCourses.filter(course => {
        if (!course.course_description) return false;
        
        return activeFilters.subjects.some(subject => 
          subject && course.course_description.toLowerCase().includes(subject.toLowerCase())
        );
      });
      console.log(`After subjects filter: ${filteredCourses.length} courses`);
    }
    
    // Filter based on credit levels
    if (activeFilters.creditLevels && activeFilters.creditLevels.length > 0) {
      filteredCourses = filteredCourses.filter(course => {
        // First check credit_level which is the most reliable source
        if (course.credit_level && typeof course.credit_level === 'string') {
          const creditLevelLower = course.credit_level.toLowerCase();
          
          // Check if the credit_level matches any of the selected SCQF levels
          return activeFilters.creditLevels.some(level => {
            // Convert level to number if it's a string
            const numericLevel = typeof level === 'string' ? parseInt(level) : level;
            
            // Look for various SCQF level patterns in the credit_level string
            return creditLevelLower.includes(`scqf level ${numericLevel}`) || 
                   creditLevelLower.includes(`scqf level ${numericLevel.toString().padStart(2, '0')}`) ||  // For "SCQF Level 07"
                   creditLevelLower.includes(`scqf${numericLevel}`) ||
                   creditLevelLower.includes(`level ${numericLevel}`) ||
                   creditLevelLower.includes(`level${numericLevel}`);
          });
        } else if (course.level && typeof course.level === 'string') {
          const levelLower = course.level.toLowerCase();
          
          // Check if the course level matches any of the selected SCQF levels
          return activeFilters.creditLevels.some(level => {
            // Convert level to number if it's a string
            const numericLevel = typeof level === 'string' ? parseInt(level) : level;
            
            // Look for various SCQF level patterns in the course level string
            return levelLower.includes(`scqf level ${numericLevel}`) || 
                   levelLower.includes(`scqf level ${numericLevel.toString().padStart(2, '0')}`) ||  // For "SCQF Level 07"
                   levelLower.includes(`scqf${numericLevel}`) ||
                   levelLower.includes(`level ${numericLevel}`) ||
                   levelLower.includes(`level${numericLevel}`);
          });
        }
        
        return false; // If no level information is available
      });
      console.log(`After credit levels filter: ${filteredCourses.length} courses`);
    }
    
    // Filter based on credit range
    if (activeFilters.credits) {
      const minCredits = parseInt(activeFilters.credits.min) || 0;
      const maxCredits = parseInt(activeFilters.credits.max) || 120;
      
      filteredCourses = filteredCourses.filter(course => {
        if (!course.credits) return false;
        
        const courseCredits = parseInt(course.credits);
        return !isNaN(courseCredits) && courseCredits >= minCredits && courseCredits <= maxCredits;
      });
      console.log(`After credits range filter: ${filteredCourses.length} courses`);
    }
    
    // Filter based on course level (undergraduate/postgraduate)
    if (activeFilters.courseLevel) {
      filteredCourses = filteredCourses.filter(course => {
        const courseLevelLower = activeFilters.courseLevel.toLowerCase();
        
        // First check credit_level which is the most reliable source
        if (course.credit_level && typeof course.credit_level === 'string') {
          const creditLevelLower = course.credit_level.toLowerCase();
          
          if (courseLevelLower === 'undergraduate') {
            // Check for undergraduate indicators in credit_level
            return creditLevelLower.includes('undergraduate') || 
                   creditLevelLower.match(/scqf level 0?[7-9]/) ||
                   creditLevelLower.match(/scqf level 10/) ||
                   creditLevelLower.includes('year 1') ||
                   creditLevelLower.includes('year 2') ||
                   creditLevelLower.includes('year 3') ||
                   creditLevelLower.includes('year 4') ||
                   creditLevelLower.includes('1st year') ||
                   creditLevelLower.includes('2nd year') ||
                   creditLevelLower.includes('3rd year') ||
                   creditLevelLower.includes('4th year');
          } else if (courseLevelLower === 'postgraduate') {
            // Check for postgraduate indicators in credit_level
            return creditLevelLower.includes('postgraduate') || 
                   creditLevelLower.match(/scqf level 1[1-2]/) ||
                   creditLevelLower.includes('masters') ||
                   creditLevelLower.includes('doctorate') ||
                   creditLevelLower.includes('doctoral') ||
                   creditLevelLower.includes('phd');
          }
        } else if (course.level && typeof course.level === 'string') {
          const levelLower = course.level.toLowerCase();
          
          if (courseLevelLower === 'undergraduate') {
            // Check for undergraduate indicators including SCQF levels 7-10
            return levelLower.includes('undergraduate') || 
                   levelLower.includes('ug') ||
                   levelLower.match(/scqf level 0?[7-9]/) ||
                   levelLower.match(/scqf level 10/) ||
                   levelLower.includes('scqf 7') ||
                   levelLower.includes('scqf 8') ||
                   levelLower.includes('scqf 9') ||
                   levelLower.includes('scqf 10') ||
                   levelLower.includes('year 1') ||
                   levelLower.includes('year 2') ||
                   levelLower.includes('year 3') ||
                   levelLower.includes('year 4') ||
                   levelLower.includes('1st year') ||
                   levelLower.includes('2nd year') ||
                   levelLower.includes('3rd year') ||
                   levelLower.includes('4th year') ||
                   levelLower.includes('first year') ||
                   levelLower.includes('second year') ||
                   levelLower.includes('third year') ||
                   levelLower.includes('fourth year') ||
                   levelLower.includes('bachelors') ||
                   levelLower.includes('honours') ||
                   levelLower.includes('ordinary');
          } else if (courseLevelLower === 'postgraduate') {
            // Check for postgraduate indicators including SCQF levels 11-12
            return levelLower.includes('postgraduate') || 
                   levelLower.includes('pg') ||
                   levelLower.match(/scqf level 1[1-2]/) ||
                   levelLower.includes('scqf 11') ||
                   levelLower.includes('scqf 12') ||
                   levelLower.includes('msc') ||
                   levelLower.includes('phd') ||
                   levelLower.includes('masters') ||
                   levelLower.includes('doctorate') ||
                   levelLower.includes('doctoral') ||
                   levelLower.includes('graduate') ||
                   levelLower.includes('research degree');
          }
        }
        
        // Try to determine level from course name or code if available
        const courseName = (course.name || '').toLowerCase();
        const courseCode = (course.code || '').toLowerCase();
        
        if (courseLevelLower === 'undergraduate') {
          // For undergraduate, check patterns in name and code
          return courseName.includes('undergraduate') || 
                 courseCode.includes('ug') ||
                 /^[a-z]+[1-4]\d{3}$/i.test(courseCode) || // Like MATH1001 (1-4 indicates undergrad year)
                 courseName.includes('bachelors') ||
                 courseName.includes('bsc') ||
                 courseName.includes('ba ') ||
                 courseName.includes('b.a.') ||
                 courseName.includes('b.sc') ||
                 courseName.includes('year 1') ||
                 courseName.includes('year 2') ||
                 courseName.includes('year 3') ||
                 courseName.includes('year 4') ||
                 courseName.includes('1st year') ||
                 courseName.includes('2nd year') ||
                 courseName.includes('3rd year') ||
                 courseName.includes('4th year') ||
                 courseName.includes('honours');
        } else if (courseLevelLower === 'postgraduate') {
          // For postgraduate, check patterns in name and code 
          return courseName.includes('postgraduate') || 
                 courseName.includes('msc') || 
                 courseName.includes('phd') || 
                 courseName.includes('masters') || 
                 courseName.includes('m.sc') ||
                 courseName.includes('m.a.') ||
                 courseName.includes('ma ') ||
                 courseName.includes('graduate') ||
                 courseName.includes('pgce') ||
                 courseName.includes('pgde') ||
                 courseName.includes('doctoral') ||
                 courseName.includes('doctorate') ||
                 courseName.includes('research');
        }
        
        return false;
      });
      console.log(`After course level filter: ${filteredCourses.length} courses`);
    }
    
    // Filter for visiting students if not already handled by API
    if (activeFilters.visitingStudents && coursesToFilter) {
      filteredCourses = filteredCourses.filter(course => {
        const courseDesc = (course.course_description || '').toLowerCase();
        const courseName = (course.name || '').toLowerCase();
        
        return courseDesc.includes('visiting student') || 
               courseDesc.includes('exchange') || 
               courseName.includes('visiting') || 
               courseName.includes('exchange');
      });
      console.log(`After visiting students filter: ${filteredCourses.length} courses`);
    }
    
    // Filter based on delivery method if not already handled by API
    if (activeFilters.deliveryMethod && coursesToFilter) {
      const deliveryMethodLower = activeFilters.deliveryMethod.toLowerCase();
      
      filteredCourses = filteredCourses.filter(course => {
        // Check course delivery field
        const courseDelivery = (course.delivery_method || course.delivery || '').toLowerCase();
        // Check course name which often contains delivery info
        const courseName = (course.name || '').toLowerCase();
        // Also check descriptions for delivery method info
        const courseDescription = (course.course_description || '').toLowerCase();
        
        if (deliveryMethodLower === 'on-campus') {
          return courseDelivery.includes('campus') || 
                 courseDelivery.includes('in person') || 
                 courseDelivery.includes('face-to-face') ||
                 courseDelivery.includes('in-person') ||
                 courseDelivery.includes('on site') ||
                 courseDelivery.includes('on-site') ||
                 courseDelivery.includes('classroom') ||
                 // Check course name for delivery info
                 courseName.includes('campus') ||
                 courseName.includes('in person') ||
                 courseName.includes('in-person') ||
                 courseName.includes('on site') ||
                 courseName.includes('face-to-face') ||
                 // Also check description
                 courseDescription.includes('campus') ||
                 courseDescription.includes('in person') ||
                 courseDescription.includes('in-person') ||
                 courseDescription.includes('on site') ||
                 courseDescription.includes('on-site') ||
                 courseDescription.includes('face-to-face') ||
                 courseDescription.includes('classroom');
        } else if (deliveryMethodLower === 'online') {
          return courseDelivery.includes('online') || 
                 courseDelivery.includes('remote') || 
                 courseDelivery.includes('distance') ||
                 courseDelivery.includes('virtual') ||
                 courseDelivery.includes('web-based') ||
                 courseDelivery.includes('digital') ||
                 // Check course name for delivery info
                 courseName.includes('online') ||
                 courseName.includes('remote') ||
                 courseName.includes('distance learning') ||
                 courseName.includes('distance-learning') ||
                 courseName.includes('virtual') ||
                 courseName.includes('web-based') ||
                 courseName.includes('digital') ||
                 // Also check description
                 courseDescription.includes('online') ||
                 courseDescription.includes('remote') ||
                 courseDescription.includes('distance') ||
                 courseDescription.includes('virtual') ||
                 courseDescription.includes('web-based') ||
                 courseDescription.includes('digital');
        } else if (deliveryMethodLower === 'hybrid') {
          return courseDelivery.includes('hybrid') || 
                 courseDelivery.includes('blended') ||
                 courseDelivery.includes('mix of') ||
                 courseDelivery.includes('mixed') ||
                 courseDelivery.includes('combination') ||
                 courseDelivery.includes('both online and') ||
                 // Check course name for delivery info
                 courseName.includes('hybrid') ||
                 courseName.includes('blended') ||
                 courseName.includes('mixed mode') ||
                 courseName.includes('combined') ||
                 // Also check description
                 courseDescription.includes('hybrid') ||
                 courseDescription.includes('blended') ||
                 courseDescription.includes('mix of') ||
                 courseDescription.includes('mixed') ||
                 courseDescription.includes('combination') ||
                 courseDescription.includes('both online and');
        }
        
        return true; // If no delivery method specified or no match criteria
      });
      console.log(`After delivery method filter: ${filteredCourses.length} courses`);
    }
    
    // Filter based on years
    if (activeFilters.years && activeFilters.years.length > 0) {
      filteredCourses = filteredCourses.filter(course => {
        // First check credit_level which is the most reliable source
        if (course.credit_level && typeof course.credit_level === 'string') {
          const creditLevelLower = course.credit_level.toLowerCase();
          
          // Look for year indicators in credit_level
          const hasExplicitYear = activeFilters.years.some(year => {
            // Convert year to number if it's a string
            const numericYear = typeof year === 'string' ? parseInt(year) : year;
            
            // Look for explicit year indicators in credit_level (e.g., "SCQF Level 10 (Year 3 Undergraduate)")
            return creditLevelLower.includes(`year ${numericYear}`) || 
                   creditLevelLower.includes(`(year ${numericYear})`) ||
                   creditLevelLower.includes(`year${numericYear}`) ||
                   creditLevelLower.includes(`${numericYear}st year`) ||
                   creditLevelLower.includes(`${numericYear}nd year`) ||
                   creditLevelLower.includes(`${numericYear}rd year`) ||
                   creditLevelLower.includes(`${numericYear}th year`);
          });
          
          if (hasExplicitYear) {
            return true;
          }
          
          // If no explicit year, check SCQF level to infer year
          return activeFilters.years.some(year => {
            const numericYear = typeof year === 'string' ? parseInt(year) : year;
            
            // Map years to SCQF levels
            return (numericYear === 1 && (
                    creditLevelLower.includes('scqf level 07') || 
                    creditLevelLower.includes('scqf level 08') || 
                    creditLevelLower.includes('scqf level 7') || 
                    creditLevelLower.includes('scqf level 8')
                  )) ||
                  (numericYear === 2 && (
                    creditLevelLower.includes('scqf level 09') || 
                    creditLevelLower.includes('scqf level 9')
                  )) ||
                  (numericYear === 3 && (
                    creditLevelLower.includes('scqf level 10')
                  )) ||
                  (numericYear === 4 && (
                    creditLevelLower.includes('scqf level 11')
                  )) ||
                  (numericYear === 5 && (
                    creditLevelLower.includes('scqf level 12')
                  ));
          });
        } else if (course.level && typeof course.level === 'string') {
          const levelLower = course.level.toLowerCase();
          
          return activeFilters.years.some(year => {
            const numericYear = typeof year === 'string' ? parseInt(year) : year;
            
            // Check various year indicators in the level text
            return levelLower.includes(`year ${numericYear}`) || 
                   levelLower.includes(`(year ${numericYear})`) ||
                   levelLower.includes(`year${numericYear}`) ||
                   levelLower.includes(`${numericYear}st year`) ||
                   levelLower.includes(`${numericYear}nd year`) ||
                   levelLower.includes(`${numericYear}rd year`) ||
                   levelLower.includes(`${numericYear}th year`) ||
                   levelLower.includes(`level ${numericYear}`) ||
                   // Improved SCQF level mapping
                   (numericYear === 1 && (
                     levelLower.includes('scqf level 07') || 
                     levelLower.includes('scqf level 08') || 
                     levelLower.includes('scqf level 7') || 
                     levelLower.includes('scqf level 8') ||
                     levelLower.includes('scqf 7') ||
                     levelLower.includes('scqf 8') ||
                     levelLower.includes('level 7') ||
                     levelLower.includes('level 8')
                   )) ||
                   (numericYear === 2 && (
                     levelLower.includes('scqf level 09') || 
                     levelLower.includes('scqf level 9') ||
                     levelLower.includes('scqf 9') ||
                     levelLower.includes('level 9')
                   )) ||
                   (numericYear === 3 && (
                     levelLower.includes('scqf level 10') ||
                     levelLower.includes('scqf 10') ||
                     levelLower.includes('level 10')
                   )) ||
                   (numericYear === 4 && (
                     levelLower.includes('scqf level 11') ||
                     levelLower.includes('scqf 11') ||
                     levelLower.includes('level 11')
                   )) ||
                   (numericYear === 5 && (
                     levelLower.includes('scqf level 12') ||
                     levelLower.includes('scqf 12') ||
                     levelLower.includes('level 12')
                   ));
          });
        } else {
          // Try to infer year from course code or name
          const courseCode = (course.code || '').toLowerCase();
          const matchesYearCode = activeFilters.years.some(year => {
            const numericYear = typeof year === 'string' ? parseInt(year) : year;
            const regex = new RegExp(`^[a-z]+${numericYear}\\d{2,3}$`, 'i');
            return regex.test(courseCode);
          });
          
          if (matchesYearCode) return true;
          
          // Check the course name/title too
          const courseName = (course.name || '').toLowerCase();
          return activeFilters.years.some(year => {
            const numericYear = typeof year === 'string' ? parseInt(year) : year;
            return courseName.includes(`year ${numericYear}`) || 
                   courseName.includes(`${numericYear}st year`) ||
                   courseName.includes(`${numericYear}nd year`) ||
                   courseName.includes(`${numericYear}rd year`) ||
                   courseName.includes(`${numericYear}th year`);
          });
        }
      });
      console.log(`After years filter: ${filteredCourses.length} courses`);
    }
    
    return filteredCourses;
  }, [activeFilters, courses]);

  const handleSearch = (term: string, schools: string[]) => {
    // This is called from SearchBar's simple search
    setActiveFilters(prev => ({
      ...prev,
      searchTerm: term,
      schools: schools
    }));
  };

  const handleFilterChange = (filters: any) => {
    // This is called when any filter changes in SearchBar
    setActiveFilters(filters);
  };

  // Toggle between course cards and colleges view
  const toggleView = () => {
    setShowCourseCards(!showCourseCards);
  };

  // Calculate pagination values for filtered courses
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top when changing pages
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>University of Edinburgh Course Explorer</title>
        <meta name="description" content="Explore courses at the University of Edinburgh" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-blue-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            University of Edinburgh Course Explorer
          </h1>
          <p className="mt-5 max-w-3xl mx-auto text-xl text-gray-500">
            Browse courses from the University of Edinburgh's Degree Regulations and Programmes of Study (DRPS).
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar 
          onSearch={handleSearch} 
          onFilterChange={handleFilterChange} 
          currentFilters={activeFilters} 
        />

        {/* View Toggle Button */}
        <div className="flex justify-center mt-8 mb-4">
          <button 
            onClick={toggleView}
            className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showCourseCards ? "View Colleges" : "View Course Cards"}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 my-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : showCourseCards ? (
          // Course Cards Grid Layout with Pagination
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-blue-900 mb-8">Filtered Courses ({filteredCourses.length})</h2>
            
            {currentCourses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentCourses.map((course, index) => (
                    <CourseCard key={index} course={course} />
                  ))}
                </div>
                
                {/* Pagination component */}
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-xl">No courses found matching your filters.</p>
                <button 
                  onClick={() => setActiveFilters({
                    searchTerm: '',
                    schools: [],
                    subjects: [],
                    creditLevels: [],
                    credits: { min: '0', max: '120' },
                    years: [],
                    courseLevel: '',
                    visitingStudents: false,
                    deliveryMethod: '',
                    showUnavailableCourses: false
                  })} 
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          // Original Colleges Layout with updated filter handling and empty state
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredColleges.length > 0 ? (
              filteredColleges.map((college, index) => (
                <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-blue-900 mb-4">{college.name}</h3>
                    {college.schools.length > 0 ? (
                      <ul className="space-y-2">
                        {college.schools.map((school, schoolIndex) => (
                          <li key={schoolIndex}>
                            <Link href={`/courses?school=${encodeURIComponent(school.name)}`}>
                              <span className="text-blue-600 hover:text-blue-800 hover:underline">
                                {school.name}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">No schools found for this college</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-500 text-xl">No results found for your search criteria.</p>
                <button 
                  onClick={() => setActiveFilters({
                    searchTerm: '',
                    schools: [],
                    subjects: [],
                    creditLevels: [],
                    credits: { min: '0', max: '120' },
                    years: [],
                    courseLevel: '',
                    visitingStudents: false,
                    deliveryMethod: '',
                    showUnavailableCourses: false
                  })} 
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-blue-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p>© {new Date().getFullYear()} University of Edinburgh Course Explorer</p>
            <p className="mt-2 text-sm">
              Data obtained from the University of Edinburgh's Degree Regulations and Programmes of Study (DRPS).
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 