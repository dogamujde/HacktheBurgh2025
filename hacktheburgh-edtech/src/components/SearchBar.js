import { useState, useEffect, useRef, useCallback } from 'react';

const SearchBar = ({ onSearch, onFilterChange, currentFilters }) => {
  // Basic search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const [fetchError, setFetchError] = useState(null);
  
  // Advanced search states
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const advancedSearchRef = useRef(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const [creditLevels, setCreditLevels] = useState([]);
  const [minCredits, setMinCredits] = useState('0');
  const [maxCredits, setMaxCredits] = useState('120');
  const [yearFilters, setYearFilters] = useState([]);
  const [courseLevel, setCourseLevel] = useState('');
  const [visitingStudents, setVisitingStudents] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [showUnavailableCourses, setShowUnavailableCourses] = useState(false);
  
  // Synchronize with parent component filters when they change
  useEffect(() => {
    if (currentFilters) {
      setSearchTerm(currentFilters.searchTerm || '');
      setSelectedSchools(currentFilters.schools || []);
      setSelectedSubjects(currentFilters.subjects || []);
      setCreditLevels(currentFilters.creditLevels || []);
      setMinCredits(currentFilters.credits?.min || '0');
      setMaxCredits(currentFilters.credits?.max || '120');
      setYearFilters(currentFilters.years || []);
      setCourseLevel(currentFilters.courseLevel || '');
      setVisitingStudents(currentFilters.visitingStudents || false);
      setDeliveryMethod(currentFilters.deliveryMethod || '');
      setShowUnavailableCourses(currentFilters.showUnavailableCourses || false);
    }
  }, [currentFilters]);
  
  // Combined filters state
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
  
  // Fetch schools for the dropdown
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        const response = await fetch('/api/subjects');
        if (response.ok) {
          const data = await response.json();
          // Extract unique school names
          const uniqueSchools = [...new Set(data.map(school => school.name))].filter(Boolean);
          setSchools(uniqueSchools);
          
          // Mock subjects for the demo - in a real app, you'd fetch these
          const mockSubjects = [
            'Computer Science', 'Data Science', 'Artificial Intelligence',
            'Mathematics', 'Physics', 'Chemistry', 'Biology',
            'Economics', 'Business', 'Finance', 'Accounting',
            'History', 'Philosophy', 'Literature', 'Linguistics'
          ];
          setSubjects(mockSubjects);
        } else {
          setFetchError(`Error fetching schools: ${response.status}`);
          console.error('Error fetching schools:', response.statusText);
        }
      } catch (error) {
        setFetchError('Failed to fetch schools data');
        console.error('Error fetching schools:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, []);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      
      if (advancedSearchRef.current && !advancedSearchRef.current.contains(event.target)) {
        setAdvancedSearchOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Apply all filters whenever activeFilters changes
  useEffect(() => {
    if (onSearch && typeof onSearch === 'function') {
      onSearch(activeFilters.searchTerm, activeFilters.schools);
    }
    
    if (onFilterChange && typeof onFilterChange === 'function') {
      onFilterChange(activeFilters);
    }
  }, [activeFilters, onSearch, onFilterChange]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Update active filters with the new search term
    setActiveFilters(prev => ({
      ...prev,
      searchTerm: value
    }));
  };

  const handleSchoolSelection = (school) => {
    console.log(`Selected school: "${school}"`);
    
    // First check if it's already in the selected schools list
    if (selectedSchools.some(s => 
      typeof s === 'string' 
        ? s.toLowerCase() === school.toLowerCase()
        : s.name.toLowerCase() === school.toLowerCase()
    )) {
      console.log(`School "${school}" already selected, skipping`);
      return;
    }
    
    // Add the school to the list as a string
    const updatedSchools = [...selectedSchools, school];
    setSelectedSchools(updatedSchools);
    
    // Update active filters
    const updatedFilters = {
      ...activeFilters,
      schools: updatedSchools
    };
    setActiveFilters(updatedFilters);
    
    // Clear the search and close the dropdown
    setSchoolSearchTerm('');
    setDropdownOpen(false);
    
    // Trigger search immediately to show feedback to the user
    onSearch(searchTerm, updatedSchools);
    onFilterChange(updatedFilters);
    
    console.log(`Updated selected schools: ${updatedSchools.join(', ')}`);
  };
  
  const handleRemoveSchool = (schoolToRemove) => {
    console.log(`Removing school: "${schoolToRemove}"`);
    
    // Remove the school from the list, handling both string and object schools
    const updatedSchools = selectedSchools.filter(school => {
      if (typeof school === 'string') {
        return school.toLowerCase() !== schoolToRemove.toLowerCase();
      } else if (school && school.name) {
        return school.name.toLowerCase() !== schoolToRemove.toLowerCase();
      }
      return true;
    });
    
    setSelectedSchools(updatedSchools);
    
    // Update active filters
    const updatedFilters = {
      ...activeFilters,
      schools: updatedSchools
    };
    setActiveFilters(updatedFilters);
    
    // Trigger search immediately to show feedback to the user
    onSearch(searchTerm, updatedSchools);
    onFilterChange(updatedFilters);
    
    console.log(`Updated selected schools after removal: ${updatedSchools.join(', ')}`);
  };

  const clearFilters = useCallback(() => {
    // Reset all state variables
    setSelectedSchools([]);
    setSearchTerm('');
    setSelectedSubjects([]);
    setCreditLevels([]);
    setMinCredits('0');
    setMaxCredits('120');
    setYearFilters([]);
    setCourseLevel('');
    setVisitingStudents(false);
    setDeliveryMethod('');
    setShowUnavailableCourses(false);
    
    // Reset all active filters
    const resetFilters = {
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
    };
    
    setActiveFilters(resetFilters);
    
    // Call onFilterChange to update parent component
    onFilterChange(resetFilters);
    
    // Call onSearch to immediately update search results
    onSearch('', []);
  }, [onFilterChange, onSearch]);
  
  const handleSubjectSelection = (subject) => {
    if (!selectedSubjects.includes(subject)) {
      const newSelectedSubjects = [...selectedSubjects, subject];
      setSelectedSubjects(newSelectedSubjects);
      
      // Update active filters with the new subjects
      setActiveFilters(prev => ({
        ...prev,
        subjects: newSelectedSubjects
      }));
    }
    setSubjectSearchTerm('');
  };
  
  const handleRemoveSubject = (subject) => {
    const newSelectedSubjects = selectedSubjects.filter(s => s !== subject);
    setSelectedSubjects(newSelectedSubjects);
    
    // Update active filters with the new subjects
    setActiveFilters(prev => ({
      ...prev,
      subjects: newSelectedSubjects
    }));
  };
  
  const handleCreditLevelToggle = (level) => {
    let newCreditLevels;
    if (creditLevels.includes(level)) {
      newCreditLevels = creditLevels.filter(l => l !== level);
    } else {
      newCreditLevels = [...creditLevels, level];
    }
    
    setCreditLevels(newCreditLevels);
    
    // Update active filters with the new credit levels
    setActiveFilters(prev => ({
      ...prev,
      creditLevels: newCreditLevels
    }));
  };
  
  const handleYearFilterToggle = (year) => {
    // Ensure we're working with numeric years 
    const numericYear = parseInt(year);
    if (isNaN(numericYear)) {
      console.error('Invalid year value:', year);
      return;
    }
    
    let newYearFilters;
    if (yearFilters.includes(numericYear)) {
      newYearFilters = yearFilters.filter(y => y !== numericYear);
    } else {
      newYearFilters = [...yearFilters, numericYear];
    }
    
    setYearFilters(newYearFilters);
    
    // Update active filters with the new year filters (already numeric)
    setActiveFilters(prev => ({
      ...prev,
      years: newYearFilters
    }));
  };
  
  const handleMinCreditsChange = (e) => {
    const value = e.target.value;
    setMinCredits(value);
    
    // Update active filters with the new min credits
    setActiveFilters(prev => ({
      ...prev,
      credits: {
        ...prev.credits,
        min: value
      }
    }));
  };
  
  const handleMaxCreditsChange = (e) => {
    const value = e.target.value;
    setMaxCredits(value);
    
    // Update active filters with the new max credits
    setActiveFilters(prev => ({
      ...prev,
      credits: {
        ...prev.credits,
        max: value
      }
    }));
  };
  
  const handleCourseLevelChange = (level) => {
    setCourseLevel(level);
    
    // Update active filters with the new course level
    setActiveFilters(prev => ({
      ...prev,
      courseLevel: level
    }));
  };
  
  const handleVisitingStudentsChange = () => {
    const newValue = !visitingStudents;
    setVisitingStudents(newValue);
    
    // Update active filters with the new visiting students value
    setActiveFilters(prev => ({
      ...prev,
      visitingStudents: newValue
    }));
  };
  
  const handleShowUnavailableCoursesChange = () => {
    const newValue = !showUnavailableCourses;
    setShowUnavailableCourses(newValue);
    
    // Update active filters with the new availability option
    setActiveFilters(prev => ({
      ...prev,
      showUnavailableCourses: newValue
    }));
  };
  
  const handleDeliveryMethodChange = (e) => {
    const value = e.target.value;
    setDeliveryMethod(value);
    
    // Update active filters with the new delivery method
    setActiveFilters(prev => ({
      ...prev,
      deliveryMethod: value
    }));
  };
  
  const applyAdvancedSearch = () => {
    // Update active filters with all current filter states
    const updatedFilters = {
      searchTerm,
      schools: selectedSchools,
      subjects: selectedSubjects,
      creditLevels,
      credits: { min: minCredits, max: maxCredits },
      years: yearFilters,
      courseLevel,
      visitingStudents,
      deliveryMethod,
      showUnavailableCourses
    };
    
    setActiveFilters(updatedFilters);
    
    // Call onFilterChange to update parent component
    onFilterChange(updatedFilters);
  };
  
  const resetAdvancedSearch = () => {
    // Reset advanced search filters
    setSelectedSubjects([]);
    setCreditLevels([]);
    setMinCredits('0');
    setMaxCredits('120');
    setYearFilters([]);
    setCourseLevel('');
    setVisitingStudents(false);
    setDeliveryMethod('');
    setShowUnavailableCourses(false);
    
    // Update active filters with reset advanced search values
    const updatedFilters = {
      ...activeFilters,
      subjects: [],
      creditLevels: [],
      credits: { min: '0', max: '120' },
      years: [],
      courseLevel: '',
      visitingStudents: false,
      deliveryMethod: '',
      showUnavailableCourses: false
    };
    
    setActiveFilters(updatedFilters);
    
    // Call onFilterChange to update parent component
    onFilterChange(updatedFilters);
  };
  
  // Filter schools based on search term - make sure we handle case sensitivity properly
  const filteredSchools = schoolSearchTerm
    ? schools.filter(school => {
        // Case-insensitive search
        const schoolLower = school.toLowerCase();
        const searchTermLower = schoolSearchTerm.toLowerCase();
        
        // Check if it's already selected - with proper case-insensitive comparison
        const isAlreadySelected = selectedSchools.some(selected => {
          if (typeof selected === 'string') {
            return selected.toLowerCase() === schoolLower;
          } else if (selected && selected.name) {
            return selected.name.toLowerCase() === schoolLower;
          }
          return false;
        });
        
        const matches = schoolLower.includes(searchTermLower) && !isAlreadySelected;
        
        // Debug logging - removed the self-reference to filteredSchools
        if (matches) {
          console.log('School match in dropdown:', {
            school,
            searchTerm: schoolSearchTerm,
            isAlreadySelected
          });
        }
        
        return matches;
      })
    : schools.filter(school => {
        // Check if it's already selected - with case insensitivity
        const schoolLower = school.toLowerCase();
        const isAlreadySelected = selectedSchools.some(selected => {
          if (typeof selected === 'string') {
            return selected.toLowerCase() === schoolLower;
          } else if (selected && selected.name) {
            return selected.name.toLowerCase() === schoolLower;
          }
          return false;
        });
        
        return !isAlreadySelected;
      });

  // School Selection button text
  const getSchoolButtonText = () => {
    if (isLoading) return 'Loading schools...';
    if (selectedSchools.length === 0) return 'Select schools';
    if (selectedSchools.length === 1) {
      const school = selectedSchools[0];
      return typeof school === 'string' ? school : (school && school.name ? school.name : 'School');
    }
    return `${selectedSchools.length} schools selected`;
  };
  
  // Filter subjects based on search term
  const filteredSubjects = subjectSearchTerm
    ? subjects.filter(subject => 
        subject.toLowerCase().includes(subjectSearchTerm.toLowerCase()) && 
        !selectedSubjects.includes(subject))
    : subjects.filter(subject => !selectedSubjects.includes(subject));

  // Check if any advanced filters are active
  const hasAdvancedFilters = selectedSubjects.length > 0 || 
                             creditLevels.length > 0 || 
                             yearFilters.length > 0 || 
                             courseLevel !== '' || 
                             visitingStudents || 
                             deliveryMethod !== '' ||
                             minCredits !== '0' || 
                             maxCredits !== '120' ||
                             showUnavailableCourses;

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Search Input */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Searching for"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          />
        </div>

        {/* School Dropdown */}
        <div className="w-full md:w-64 relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
            disabled={isLoading}
            aria-label="Select schools"
            aria-expanded={dropdownOpen}
          >
            <span className="text-gray-700 truncate">
              {getSchoolButtonText()}
            </span>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
              {/* Search Schools Input */}
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search schools..."
                  value={schoolSearchTerm}
                  onChange={(e) => setSchoolSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              {/* Schools List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredSchools.length > 0 ? (
                  filteredSchools.map((school, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      onClick={() => handleSchoolSelection(school)}
                    >
                      {school}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500 italic">
                    {schoolSearchTerm ? 'No matching schools found' : 'All schools selected'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Advanced Search Button - Now in its own row */}
      <div className="w-full mt-4" ref={advancedSearchRef}>
        <button
          onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
          className={`w-full p-3 ${hasAdvancedFilters ? 'bg-blue-800' : 'bg-blue-700'} text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-blue-800 transition-colors flex items-center justify-center`}
        >
          {hasAdvancedFilters && (
            <span className="inline-flex items-center justify-center w-5 h-5 mr-2 text-xs bg-white text-blue-800 rounded-full">
              {selectedSubjects.length + creditLevels.length + yearFilters.length + (courseLevel ? 1 : 0) + (visitingStudents ? 1 : 0) + (deliveryMethod ? 1 : 0) + ((minCredits !== '0' || maxCredits !== '120') ? 1 : 0) + (showUnavailableCourses ? 1 : 0)}
            </span>
          )}
          Advanced Search
        </button>
        
        {/* Advanced Search Modal */}
        {advancedSearchOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-25 z-50 flex items-center justify-center overflow-y-auto">
            <div className="relative bg-white border border-gray-300 rounded-lg shadow-lg p-6 w-96 max-w-[95%] max-h-[90vh] overflow-y-auto m-4">
              <button
                onClick={() => setAdvancedSearchOpen(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                aria-label="Close advanced search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h3 className="text-lg font-medium text-blue-900 mb-4 border-b pb-2">Advanced Search Options</h3>
              
              {/* Search Term */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Term</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter keywords..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              
              {/* Subject Multi-select */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subjects</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search subjects..."
                    value={subjectSearchTerm}
                    onChange={(e) => setSubjectSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {subjectSearchTerm && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredSubjects.length > 0 ? (
                        filteredSubjects.map((subject, index) => (
                          <button
                            key={index}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                            onClick={() => handleSubjectSelection(subject)}
                          >
                            {subject}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 italic">
                          No matching subjects found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Selected Subjects Tags */}
                {selectedSubjects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSubjects.map((subject, index) => (
                      <div 
                        key={index}
                        className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {subject}
                        <button
                          onClick={() => handleRemoveSubject(subject)}
                          className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* SCQF Credit Level */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  SCQF Credit Level
                  <div className="relative ml-1 group">
                    <span className="cursor-help text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <div className="absolute left-0 bottom-full mb-2 w-64 bg-black text-white text-xs rounded p-2 hidden group-hover:block z-10">
                      <p>SCQF Level 7-10: Undergraduate levels</p>
                      <p>SCQF Level 11-12: Postgraduate levels</p>
                      <p>Level 7 = Year 1, Level 8 = Year 2, etc.</p>
                      <div className="absolute left-0 top-full w-3 h-3 bg-black transform rotate-45"></div>
                    </div>
                  </div>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[7, 8, 9, 10, 11, 12].map((level) => (
                    <label key={level} className="inline-flex items-center">
                      <input 
                        type="checkbox" 
                        checked={creditLevels.includes(level)} 
                        onChange={() => handleCreditLevelToggle(level)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Credit Volume Range */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">SCQF Credit Volume</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={minCredits}
                    onChange={handleMinCreditsChange}
                    className="w-20 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={maxCredits}
                    onChange={handleMaxCreditsChange}
                    className="w-20 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Year Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((year) => (
                    <label key={year} className="inline-flex items-center">
                      <input 
                        type="checkbox" 
                        checked={yearFilters.includes(year)} 
                        onChange={() => handleYearFilterToggle(year)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Year {year}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Course Level */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Level</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input 
                      type="radio" 
                      name="courseLevel" 
                      value="undergraduate"
                      checked={courseLevel === 'undergraduate'} 
                      onChange={() => handleCourseLevelChange('undergraduate')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Undergraduate</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input 
                      type="radio" 
                      name="courseLevel" 
                      value="postgraduate"
                      checked={courseLevel === 'postgraduate'} 
                      onChange={() => handleCourseLevelChange('postgraduate')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Postgraduate</span>
                  </label>
                </div>
              </div>
              
              {/* Visiting Students */}
              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    checked={visitingStudents} 
                    onChange={handleVisitingStudentsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Available to Visiting Students</span>
                </label>
              </div>
              
              {/* Delivery Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
                <select 
                  value={deliveryMethod} 
                  onChange={handleDeliveryMethodChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any</option>
                  <option value="in-person">In-Person</option>
                  <option value="online">Online</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              
              {/* Show Unavailable Courses */}
              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    checked={showUnavailableCourses} 
                    onChange={handleShowUnavailableCoursesChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Unavailable Courses</span>
                  <div className="relative ml-1 group">
                    <span className="cursor-help text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <div className="absolute left-0 bottom-full mb-2 w-64 bg-black text-white text-xs rounded p-2 hidden group-hover:block z-10">
                      <p>Include courses with "Not delivered this year" status.</p>
                      <p>By default, these courses are hidden.</p>
                      <div className="absolute left-0 top-full w-3 h-3 bg-black transform rotate-45"></div>
                    </div>
                  </div>
                </label>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={resetAdvancedSearch}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    applyAdvancedSearch();
                    setAdvancedSearchOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Filters Display Section */}
      <div className="mt-4">
        {/* Selected Schools Tags */}
        {selectedSchools.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedSchools.map((school, index) => {
              const schoolName = typeof school === 'string' ? school : (school && school.name ? school.name : 'School');
              return (
                <div 
                  key={index}
                  className="inline-flex items-center bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm"
                >
                  {schoolName}
                  <button
                    onClick={() => handleRemoveSchool(schoolName)}
                    className="ml-2 text-gray-600 hover:text-gray-800 focus:outline-none"
                    aria-label={`Remove ${schoolName}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Search Term Tag */}
        {searchTerm && (
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Search: {searchTerm}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilters(prev => ({ ...prev, searchTerm: '' }));
                }}
                className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Display other active filters */}
        {hasAdvancedFilters && (
          <div className="flex flex-wrap gap-2 mb-2">
            {/* Credit Levels */}
            {creditLevels.length > 0 && (
              <div className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                Levels: {creditLevels.join(', ')}
              </div>
            )}
            
            {/* Credits Range */}
            {(minCredits !== '0' || maxCredits !== '120') && (
              <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                Credits: {minCredits} - {maxCredits}
              </div>
            )}
            
            {/* Year Filters */}
            {yearFilters.length > 0 && (
              <div className="inline-flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                Years: {yearFilters.map(y => `Year ${y}`).join(', ')}
              </div>
            )}
            
            {/* Course Level */}
            {courseLevel && (
              <div className="inline-flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                {courseLevel === 'undergraduate' ? 'Undergraduate' : 'Postgraduate'}
              </div>
            )}
            
            {/* Visiting Students */}
            {visitingStudents && (
              <div className="inline-flex items-center bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm">
                Visiting Students
              </div>
            )}
            
            {/* Delivery Method */}
            {deliveryMethod && (
              <div className="inline-flex items-center bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm">
                {deliveryMethod === 'in-person' ? 'In-Person' : deliveryMethod === 'online' ? 'Online' : 'Hybrid'}
              </div>
            )}
            
            {/* Show Unavailable Courses */}
            {showUnavailableCourses && (
              <div className="inline-flex items-center bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                Including Unavailable Courses
              </div>
            )}
          </div>
        )}
        
        {/* Clear All Filters Button - show when any filter is active */}
        {(searchTerm || selectedSchools.length > 0 || hasAdvancedFilters) && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center text-sm text-red-600 hover:text-red-800 font-medium mt-2"
          >
            Clear All Filters
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar; 