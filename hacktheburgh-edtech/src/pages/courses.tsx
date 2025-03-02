import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

type Course = {
  code: string;
  title: string;
  credits: string;
  level: string;
  semester: string;
  year: string;
  availability?: string;
  period?: string;
};

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

export default function Courses() {
  const router = useRouter();
  const { school } = router.query;
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!school) return;

    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/courses?school=${encodeURIComponent(school as string)}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.courses) {
          setCourses(data.courses);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Failed to fetch courses. Please try again later.');
        setLoading(false);
      }
    };

    fetchCourses();
  }, [school]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{school ? `${school} Courses` : 'Courses'} | University of Edinburgh</title>
        <meta name="description" content={`Browse courses from ${school || 'the University of Edinburgh'}`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/">
            <span className="text-blue-600 hover:text-blue-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Colleges
            </span>
          </Link>
        </div>

        <div className="mb-12">
          <h1 className="text-3xl font-extrabold text-blue-900 sm:text-4xl">
            {school ? `${school} Courses` : 'All Courses'}
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Browse available courses and their details.
          </p>
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
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No courses found for this school.</p>
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Course Code</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Course Title</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Credits</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Level</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Semester</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {courses.map((course, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-blue-600 sm:pl-6">
                      <a 
                        href={getPathURL(course.code, course.availability, course.period || course.semester)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center"
                      >
                        {course.code}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{course.title}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{course.credits}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{course.level}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{course.semester}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
} 