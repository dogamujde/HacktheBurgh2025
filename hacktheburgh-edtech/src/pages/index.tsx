import { useState, useEffect } from 'react';
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
    deliveryMethod: ''
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
          params.append('school', activeFilters.schools.join(','));
          console.log('Sending schools to API:', activeFilters.schools.join(','));
        }
        
        // Add search term if present
        if (activeFilters.searchTerm) {
          params.append('search', activeFilters.searchTerm);
        }
        
        // Add other filters as needed
        if (activeFilters.years.length > 0) {
          params.append('years', activeFilters.years.join(','));
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
      activeFilters.schools.length > 0
    )) {
      fetchFilteredCourses();
    } else if (courses.length > 0) {
      // Apply filters client-side for other cases
      filterCourses();
    }
  }, [activeFilters, courses]);
  
  // Function to filter courses based on all active filters
  const filterCourses = (coursesToFilter = courses) => {
    console.log('Filtering courses client-side:', { activeFilters, coursesCount: coursesToFilter.length });
    
    if (!coursesToFilter || coursesToFilter.length === 0) {
      console.log('No courses to filter');
      return [];
    }
    
    let filtered = [...coursesToFilter];
    
    // Log initial state
    console.log(`Starting with ${filtered.length} courses before applying filters`);
    
    // Filter by search term
    if (activeFilters.searchTerm) {
      const searchTermLower = activeFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(course => {
        const name = (course.name || course.title || '').toLowerCase();
        const code = (course.code || '').toLowerCase();
        const description = (course.course_description || '').toLowerCase();
        
        return name.includes(searchTermLower) || 
               code.includes(searchTermLower) || 
               description.includes(searchTermLower);
      });
      
      console.log(`After search term filtering, found ${filtered.length} courses`);
    }
    
    // Filter by schools
    if (activeFilters.schools.length > 0) {
      console.log('Filtering by schools:', activeFilters.schools);
      
      filtered = filtered.filter(course => {
        // Make sure we have either school_name or school data
        if (!course.school_name && !course.school) {
          return false;
        }
        
        // Check if any of the selected schools match the course's school or school_name
        const matchesSchool = activeFilters.schools.some(school => {
          const schoolLower = school.toLowerCase();
          return (course.school_name && course.school_name.toLowerCase().includes(schoolLower)) ||
                 (course.school && course.school.toLowerCase().includes(schoolLower));
        });
        
        // For debugging, log some sample results
        if (matchesSchool && filtered.length < 5) {
          console.log('School match found:', {
            courseSchoolName: course.school_name,
            courseSchool: course.school,
            selectedSchools: activeFilters.schools,
            courseName: course.name || course.title
          });
        }
        
        return matchesSchool;
      });
      
      console.log('After school filtering, found', filtered.length, 'courses');
    }
    
    // Filter by subjects
    if (activeFilters.subjects.length > 0) {
      filtered = filtered.filter(course => {
        const name = (course.name || course.title || '').toLowerCase();
        const description = (course.course_description || '').toLowerCase();
        
        return activeFilters.subjects.some(subject => 
          name.includes(subject.toLowerCase()) || 
          description.includes(subject.toLowerCase())
        );
      });
      
      console.log(`After subject filtering, found ${filtered.length} courses`);
    }
    
    // Filter by credit levels
    if (activeFilters.creditLevels.length > 0) {
      filtered = filtered.filter(course => {
        const creditLevel = (course.credit_level || course.level || '').toLowerCase();
        
        return activeFilters.creditLevels.some(level => 
          creditLevel.includes(level.toLowerCase())
        );
      });
      
      console.log(`After credit level filtering, found ${filtered.length} courses`);
    }
    
    // Filter by credit range
    if (activeFilters.credits.min !== '0' || activeFilters.credits.max !== '120') {
      filtered = filtered.filter(course => {
        // Extract the credit value as a number
        const creditString = course.credits || '';
        const creditValue = parseInt(creditString.match(/\d+/)?.[0] || '0', 10);
        
        const minCredits = parseInt(activeFilters.credits.min || '0', 10);
        const maxCredits = parseInt(activeFilters.credits.max || '120', 10);
        
        return creditValue >= minCredits && creditValue <= maxCredits;
      });
      
      console.log(`After credit range filtering, found ${filtered.length} courses`);
    }
    
    // Filter by year (1-5)
    if (activeFilters.years.length > 0) {
      filtered = filtered.filter(course => {
        const levelString = (course.credit_level || course.level || '').toLowerCase();
        
        // Try to extract the year
        const yearMatch = levelString.match(/year (\d+)/i);
        if (yearMatch) {
          const year = parseInt(yearMatch[1], 10);
          return activeFilters.years.includes(year.toString());
        }
        
        // Check for postgraduate
        if (levelString.includes('postgraduate') && activeFilters.years.includes('5')) {
          return true;
        }
        
        // Try to infer from SCQF level
        const levelMatch = levelString.match(/level (\d+)/i);
        if (levelMatch) {
          const level = parseInt(levelMatch[1], 10);
          
          // Map SCQF levels to years
          if ((level === 7 || level === 8) && activeFilters.years.includes('1')) return true;
          if (level === 9 && activeFilters.years.includes('2')) return true;
          if (level === 10 && (activeFilters.years.includes('3') || activeFilters.years.includes('4'))) return true;
          if (level >= 11 && activeFilters.years.includes('5')) return true;
        }
        
        return false;
      });
      
      console.log(`After year filtering, found ${filtered.length} courses`);
    }
    
    // Filter by course level
    if (activeFilters.courseLevel) {
      filtered = filtered.filter(course => {
        const levelString = (course.credit_level || course.level || '').toLowerCase();
        
        if (activeFilters.courseLevel === 'undergraduate') {
          return levelString.includes('undergraduate') || 
                 (levelString.match(/level [7-9]/i) !== null) ||
                 (levelString.match(/level 10/i) !== null);
        } else if (activeFilters.courseLevel === 'postgraduate') {
          return levelString.includes('postgraduate') || 
                 (levelString.match(/level 1[1-2]/i) !== null);
        }
        
        return true;
      });
      
      console.log(`After course level filtering, found ${filtered.length} courses`);
    }
    
    // Filter by visiting students
    if (activeFilters.visitingStudents) {
      filtered = filtered.filter(course => {
        // This would depend on your data structure
        return course.visiting_students === true ||
               (course.course_description || '').toLowerCase().includes('visiting student');
      });
      
      console.log(`After visiting students filtering, found ${filtered.length} courses`);
    }
    
    // Filter by delivery method
    if (activeFilters.deliveryMethod) {
      filtered = filtered.filter(course => {
        const deliveryMethod = (course.delivery_method || '').toLowerCase();
        return deliveryMethod === activeFilters.deliveryMethod.toLowerCase();
      });
      
      console.log(`After delivery method filtering, found ${filtered.length} courses`);
    }
    
    console.log(`Final filtered count: ${filtered.length} courses`);
    return filtered;
  };

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
        <SearchBar onSearch={handleSearch} onFilterChange={handleFilterChange} />

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
                    deliveryMethod: ''
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
                    deliveryMethod: ''
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