import { useState, useEffect, useRef, useCallback } from 'react';

const SearchBar = ({ onSearch, onFilterChange }) => {
  // Basic search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  
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
    deliveryMethod: ''
  });
  
  // Fetch schools for the dropdown
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/subjects');
        if (response.ok) {
          const data = await response.json();
          // Extract unique school names
          const uniqueSchools = [...new Set(data.map(school => school.name))];
          setSchools(uniqueSchools);
          
          // Mock subjects for the demo - in a real app, you'd fetch these
          const mockSubjects = [
            'Computer Science', 'Data Science', 'Artificial Intelligence',
            'Mathematics', 'Physics', 'Chemistry', 'Biology',
            'Economics', 'Business', 'Finance', 'Accounting',
            'History', 'Philosophy', 'Literature', 'Linguistics'
          ];
          setSubjects(mockSubjects);
        }
      } catch (error) {
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
    if (onSearch) {
      onSearch(activeFilters.searchTerm, activeFilters.schools);
    }
    
    if (onFilterChange) {
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
    // Only add if it's not already selected
    if (!selectedSchools.includes(school)) {
      const newSelectedSchools = [...selectedSchools, school];
      setSelectedSchools(newSelectedSchools);
      
      // Update active filters with the new schools
      setActiveFilters(prev => ({
        ...prev,
        schools: newSelectedSchools
      }));
    }
    
    // Clear search term and close dropdown
    setSchoolSearchTerm('');
    setDropdownOpen(false);
  };
  
  const handleRemoveSchool = (schoolToRemove) => {
    const newSelectedSchools = selectedSchools.filter(
      school => school !== schoolToRemove
    );
    setSelectedSchools(newSelectedSchools);
    
    // Update active filters with the new schools
    setActiveFilters(prev => ({
      ...prev,
      schools: newSelectedSchools
    }));
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
    
    // Reset all active filters
    setActiveFilters({
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
  }, []);
  
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
    let newYearFilters;
    if (yearFilters.includes(year)) {
      newYearFilters = yearFilters.filter(y => y !== year);
    } else {
      newYearFilters = [...yearFilters, year];
    }
    
    setYearFilters(newYearFilters);
    
    // Update active filters with the new year filters
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
    setActiveFilters({
      searchTerm,
      schools: selectedSchools,
      subjects: selectedSubjects,
      creditLevels,
      credits: { min: minCredits, max: maxCredits },
      years: yearFilters,
      courseLevel,
      visitingStudents,
      deliveryMethod
    });
    
    // Close the advanced search dropdown
    setAdvancedSearchOpen(false);
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
    
    // Update active filters with reset advanced search values
    setActiveFilters(prev => ({
      ...prev,
      subjects: [],
      creditLevels: [],
      credits: { min: '0', max: '120' },
      years: [],
      courseLevel: '',
      visitingStudents: false,
      deliveryMethod: ''
    }));
  };
  
  // Filter schools based on search term
  const filteredSchools = schoolSearchTerm
    ? schools.filter(school => 
        school.toLowerCase().includes(schoolSearchTerm.toLowerCase()) && 
        !selectedSchools.includes(school))
    : schools.filter(school => !selectedSchools.includes(school));
    
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
                             maxCredits !== '120';

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
          >
            <span className="text-gray-700 truncate">
              {isLoading ? 'Loading schools...' : 'Select schools'}
            </span>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
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
        
        {/* Advanced Search Button */}
        <div className="w-full md:w-auto relative" ref={advancedSearchRef}>
          <button
            onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
            className={`w-full p-3 ${hasAdvancedFilters ? 'bg-blue-800' : 'bg-blue-700'} text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-blue-800 transition-colors flex items-center`}
          >
            {hasAdvancedFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 mr-2 text-xs bg-white text-blue-800 rounded-full">
                {selectedSubjects.length + creditLevels.length + yearFilters.length + (courseLevel ? 1 : 0) + (visitingStudents ? 1 : 0) + (deliveryMethod ? 1 : 0) + ((minCredits !== '0' || maxCredits !== '120') ? 1 : 0)}
              </span>
            )}
            Advanced Search
          </button>
          
          {/* Advanced Search Dropdown Panel */}
          {advancedSearchOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-300 rounded-lg shadow-lg z-20 p-4">
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
              
              {/* Action Buttons */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={resetAdvancedSearch}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Reset
                </button>
                <button
                  onClick={applyAdvancedSearch}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Filters Display Section */}
      <div className="mt-4">
        {/* Selected Schools Tags */}
        {selectedSchools.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedSchools.map((school, index) => (
              <div 
                key={index}
                className="inline-flex items-center bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm"
              >
                {school}
                <button
                  onClick={() => handleRemoveSchool(school)}
                  className="ml-2 text-gray-600 hover:text-gray-800 focus:outline-none"
                  aria-label={`Remove ${school}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
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