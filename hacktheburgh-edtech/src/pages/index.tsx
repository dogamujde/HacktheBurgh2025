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
        
        // Build query parameters for the API request
        const params = new URLSearchParams();
        
        if (activeFilters.searchTerm) {
          params.append('search', activeFilters.searchTerm);
        }
        
        if (activeFilters.schools.length > 0) {
          // Just use the first school for simplicity (API limitation)
          params.append('school', activeFilters.schools[0]);
        }
        
        if (activeFilters.years.length > 0) {
          params.append('years', activeFilters.years.join(','));
        }
        
        // Fetch courses with filters applied
        const url = `/api/courses${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error fetching filtered courses: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update courses with filtered results from API
        if (activeFilters.years.length > 0 || activeFilters.searchTerm || activeFilters.schools.length > 0) {
          setFilteredCourses(data.courses || []);
        } else {
          // If no filters are active, just filter the existing courses
          filterCourses();
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching filtered courses:', error);
        setLoading(false);
      }
    };
    
    // Only fetch from API when year filters change or when specific filters are applied
    if (courses.length > 0 && (activeFilters.years.length > 0 || activeFilters.searchTerm || activeFilters.schools.length > 0)) {
      fetchFilteredCourses();
    }
  }, [activeFilters.years, activeFilters.searchTerm, activeFilters.schools]);
  
  // Function to filter courses based on all active filters
  const filterCourses = () => {
    let filtered = [...courses];
    
    // Filter by search term
    if (activeFilters.searchTerm) {
      const searchLower = activeFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(course => {
        const name = course.name || course.title || '';
        const description = course.course_description || '';
        const code = course.code || '';
        
        return name.toLowerCase().includes(searchLower) || 
               code.toLowerCase().includes(searchLower) ||
               description.toLowerCase().includes(searchLower);
      });
      
      // Sort filtered courses to prioritize matches in the name
      filtered.sort((a, b) => {
        const nameA = (a.name || a.title || '').toLowerCase();
        const nameB = (b.name || b.title || '').toLowerCase();
        
        // Check if search term is in the name
        const searchInNameA = nameA.includes(searchLower);
        const searchInNameB = nameB.includes(searchLower);
        
        // Prioritize courses with search term in name
        if (searchInNameA && !searchInNameB) return -1;
        if (!searchInNameA && searchInNameB) return 1;
        
        // If both have or don't have the search term in name, keep original order
        return 0;
      });
    }
    
    // Filter by schools
    if (activeFilters.schools.length > 0) {
      filtered = filtered.filter(course => 
        course.school_name && activeFilters.schools.includes(course.school_name)
      );
    }
    
    // Filter by subjects (mock implementation - would need real subject data)
    if (activeFilters.subjects.length > 0) {
      // In a real app, you'd have subject data to filter on
      // This is a placeholder that simulates subject filtering
      filtered = filtered.filter(course => {
        // Simulate matching subjects with course name or description
        const name = course.name || course.title || '';
        const description = course.course_description || '';
        
        return activeFilters.subjects.some(subject => 
          name.includes(subject) || 
          description.includes(subject)
        );
      });
    }
    
    // Filter by year
    if (activeFilters.years.length > 0) {
      filtered = filtered.filter(course => {
        // Extract year from credit_level or level string (e.g., "SCQF Level 8 (Year 1 Undergraduate)" -> 1)
        const levelString = course.credit_level || course.level || '';
        const yearMatch = levelString.match(/Year (\d+)/i);
        
        // If there's a direct year match, use it
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          return activeFilters.years.includes(year);
        }
        
        // Alternative: Try to infer year from the SCQF level for undergraduate courses
        const levelMatch = levelString.match(/Level (\d+)/);
        if (levelMatch && levelString.toLowerCase().includes('undergraduate')) {
          const level = parseInt(levelMatch[1]);
          // Map SCQF levels to years (approximate mapping: level 7-8 -> year 1, 9-10 -> year 2, etc.)
          const year = level >= 7 ? Math.min(Math.ceil((level - 6) / 2), 4) : null;
          return year && activeFilters.years.includes(year);
        }
        
        // For postgraduate courses, assume they're year 5 if the filter includes year 5
        if (levelString.toLowerCase().includes('postgraduate')) {
          return activeFilters.years.includes(5);
        }
        
        return false;
      });
    }
    
    // Filter by credit levels
    if (activeFilters.creditLevels.length > 0) {
      filtered = filtered.filter(course => {
        // Extract level number from credit_level string (e.g., "SCQF Level 8 (Year 1 Undergraduate)" -> 8)
        const levelString = course.credit_level || course.level || '';
        const levelMatch = levelString.match(/Level (\d+)/);
        const level = levelMatch ? parseInt(levelMatch[1]) : null;
        
        return level && activeFilters.creditLevels.includes(level);
      });
    }
    
    // Filter by credit range
    if (activeFilters.credits.min !== '0' || activeFilters.credits.max !== '120') {
      filtered = filtered.filter(course => {
        const courseCredits = parseInt(course.credits || '0');
        return !isNaN(courseCredits) && 
               courseCredits >= parseInt(activeFilters.credits.min) && 
               courseCredits <= parseInt(activeFilters.credits.max);
      });
    }
    
    // Filter by course level (undergraduate/postgraduate)
    if (activeFilters.courseLevel) {
      filtered = filtered.filter(course => {
        // Extract level number from credit_level string
        const levelString = course.credit_level || course.level || '';
        const levelMatch = levelString.match(/Level (\d+)/);
        const level = levelMatch ? parseInt(levelMatch[1]) : null;
        
        // Also check if the string directly indicates undergraduate or postgraduate
        const isPostgrad = levelString.toLowerCase().includes('postgraduate');
        const isUndergrad = levelString.toLowerCase().includes('undergraduate');
        
        if (activeFilters.courseLevel === 'postgraduate') {
          return isPostgrad || (level && level >= 11);
        } else {
          return isUndergrad || (level && level < 11);
        }
      });
    }
    
    // Filter by delivery method
    if (activeFilters.deliveryMethod) {
      // This is a placeholder - in a real app you'd have delivery method data
      filtered = filtered.filter(course => {
        if (activeFilters.deliveryMethod === 'online') {
          return course.period.includes('Online');
        } else if (activeFilters.deliveryMethod === 'in-person') {
          return !course.period.includes('Online');
        }
        return true; // For hybrid or when we don't have the data
      });
    }
    
    setFilteredCourses(filtered);
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