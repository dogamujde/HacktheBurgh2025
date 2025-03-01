// Types for our data
export type Course = {
  code: string;
  name: string;
  url: string;
  availability: string;
  period: string;
  credits: string;
  subject: string;
  school_name: string;
  college: string;
  course_description?: string;
  summary?: string;
  school?: string;
  credit_level?: string;
  scqf_credits?: string;
  ects_credits?: string;
  pre_requisites?: string;
  co_requisites?: string;
  prohibited_combinations?: string;
  [key: string]: any; // For additional fields from detailed info
};

export type Subject = {
  name: string;
  url: string;
  school_name: string;
  school_code: string;
  college: string;
};

export type School = {
  name: string;
  url: string;
  college: string;
  schedule: string;
  code: string;
};

export type College = {
  name: string;
  schools_count: number;
};

// API functions
export async function fetchCourses(filters: {
  school?: string;
  subject?: string;
  search?: string;
}): Promise<Course[]> {
  const queryParams = new URLSearchParams();
  
  if (filters.school) queryParams.append('school', filters.school);
  if (filters.subject) queryParams.append('subject', filters.subject);
  if (filters.search) queryParams.append('search', filters.search);
  
  const response = await fetch(`/api/courses?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }
  
  return response.json();
}

export async function fetchCollegesAndSchools(college?: string): Promise<{
  colleges: College[];
  schools: School[];
}> {
  const queryParams = new URLSearchParams();
  
  if (college) queryParams.append('college', college);
  
  const response = await fetch(`/api/colleges?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch colleges and schools');
  }
  
  return response.json();
}

export async function fetchSubjects(filters: {
  school?: string;
  college?: string;
}): Promise<Subject[]> {
  const queryParams = new URLSearchParams();
  
  if (filters.school) queryParams.append('school', filters.school);
  if (filters.college) queryParams.append('college', filters.college);
  
  const response = await fetch(`/api/subjects?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch subjects');
  }
  
  return response.json();
} 