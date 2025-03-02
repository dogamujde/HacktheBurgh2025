import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the CourseBulletPoints component with SSR disabled
// This ensures it only loads on the client side where the API can be called
const CourseBulletPoints = dynamic(
  () => import('../../components/CourseBulletPoints'),
  { ssr: false }
);

type CourseDetail = {
  code: string;
  title: string;
  credits: string;
  level: string;
  semester: string;
  year: string;
  delivery: string;
  availability: string;
  period: string;
  course_description?: string;
  learning_outcomes?: string[];
  assessment_methods?: string;
  prerequisites?: string;
  contacts?: string[];
  bulletpoints?: string;
  bullet_points?: string;
  [key: string]: any;
};

export default function CourseDetail() {
  const router = useRouter();
  const { code } = router.query;
  
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;

    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/course/${code}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setCourse(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching course details:', error);
        setError('Failed to fetch course details. Please try again later.');
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [code]);

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
    const formattedPeriod = formatPeriodForURL(period);
    // Use availability or default to SV1 if not available
    const formattedAvailability = availability || "SV1";
    return `https://path.is.ed.ac.uk/courses/${courseCode}_${formattedAvailability}_${formattedPeriod}`;
  };

  // Helper function to render course attributes
  const renderAttribute = (label: string, value: string | string[] | undefined) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    
    // Skip prerequisites section if there are no prerequisites or if it contains placeholder text
    if (label === "Prerequisites" && 
        (value === "" || 
         value.toLowerCase().includes("none") || 
         value.toLowerCase().includes("no prerequisites") ||
         value.trim() === "Students MUST have passed:" || 
         value.trim().match(/^students\s+must\s+have\s+passed:?\s*$/i))) {
      return null;
    }
    
    // Clean up prerequisites text if it starts with "Students MUST have passed:" but has actual content
    if (label === "Prerequisites" && typeof value === 'string') {
      // Handle the specific case "Students MUST have passed: No Prerequisites"
      if (value.trim().match(/^students\s+must\s+have\s+passed:?\s*no\s+prerequisites$/i)) {
        return null; // Skip displaying this redundant information
      }
      
      // If it starts with the phrase but has actual content after
      if (value.trim().match(/^students\s+must\s+have\s+passed:?\s*(.+)/i)) {
        // Keep the actual prerequisites, removing the prefix
        const match = value.trim().match(/^students\s+must\s+have\s+passed:?\s*(.+)/i);
        if (match && match[1] && match[1].trim()) {
          value = match[1].trim();
        } else {
          // If nothing meaningful after the prefix, return null
          return null;
        }
      }
    }
    
    // Skip assessment section if it contains placeholder or incorrect data
    if (label === "Assessment Methods" && 
        (value === "" || 
         typeof value === 'string' && (
           value.trim().length === 0 || 
           value.toLowerCase() === "not available" ||
           value.toLowerCase() === "n/a"
         ))) {
      return null;
    }
    
    return (
      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
          {Array.isArray(value) ? (
            <ul className="list-disc pl-5 space-y-1">
              {value.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            value
          )}
        </dd>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{course ? `${course.code} - ${course.title}` : 'Course Details'} | University of Edinburgh</title>
        <meta 
          name="description" 
          content={course?.course_description?.substring(0, 160) || 'Course details from the University of Edinburgh'} 
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/courses">
            <span className="text-blue-600 hover:text-blue-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Courses
            </span>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center my-12">
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
        ) : course ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-blue-900 text-white">
              <h1 className="text-2xl font-bold">{course.code} - {course.title}</h1>
              <p className="mt-1 max-w-2xl text-lg">{course.credits} Credits • Level {course.level}</p>
              
              {/* Add the PATH.is external link button */}
              <a 
                href={getPathURL(course.code, course.availability, course.period)}
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-blue-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on PATH
              </a>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              {/* AI-generated Bullet Points */}
              {course && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-900 mb-3">Course Overview</h3>
                  <CourseBulletPoints 
                    summary={course.name || ''}
                    description={course.course_description || ''}
                    bulletpoints={course.bulletpoints || ''}
                    bullet_points={course.bullet_points || ''}
                  />
                </div>
              )}
              
              <dl className="divide-y divide-gray-200">
                {renderAttribute("Learning Outcomes", course.learning_outcomes)}
                {renderAttribute("Assessment Methods", course.assessment_methods)}
                {renderAttribute("Delivery", course.delivery)}
                {renderAttribute("Semester", course.semester)}
                {renderAttribute("Year", course.year)}
                {renderAttribute("Prerequisites", course.prerequisites)}
                {renderAttribute("Contacts", course.contacts)}
              </dl>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Course not found.</p>
          </div>
        )}
      </main>
    </div>
  );
} 