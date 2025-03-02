import React, { useEffect, useState } from 'react';
import { useCompare } from './CompareContext';
import CourseCard from './CourseCard';

/**
 * CompareOverlay Component
 * 
 * This overlay appears only when exactly 2 cards are selected for comparison.
 * It displays the cards side-by-side and allows users to view both sides of each card.
 */
const CompareOverlay = () => {
  // Access the compare context
  const { compareMode, selectedCards, resetCompare } = useCompare();
  
  // State to manage animation
  const [isVisible, setIsVisible] = useState(false);
  
  // Only show overlay when exactly 2 cards are selected in compare mode
  const shouldShow = compareMode && selectedCards.length === 2;
  
  // Handle animation - delay showing content until overlay is visible
  useEffect(() => {
    if (shouldShow) {
      // Small delay to allow for smooth animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [shouldShow]);
  
  // Handle blurring the background
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      if (shouldShow) {
        mainContent.classList.add('blur-background');
      } else {
        mainContent.classList.remove('blur-background');
      }
    }
    
    // Clean up effect when component unmounts
    return () => {
      if (mainContent) {
        mainContent.classList.remove('blur-background');
      }
    };
  }, [shouldShow]);
  
  // Don't render anything if we shouldn't show the overlay
  if (!shouldShow) {
    return null;
  }
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm
                 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Close button in top-right */}
      <button 
        onClick={resetCompare}
        className="absolute top-4 right-4 px-2 py-1 bg-gray-300 text-black rounded-full hover:bg-gray-400 cursor-pointer"
        aria-label="Close comparison overlay"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      {/* Content container with animation */}
      <div 
        className={`bg-white bg-opacity-95 p-6 rounded-lg shadow-2xl w-full max-w-6xl mx-4 overflow-auto max-h-[90vh]
                   transform transition duration-500 ease-in-out
                   ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}`}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Course Comparison</h2>
        
        {/* Cards side by side container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {selectedCards.map((cardId, index) => (
            <div 
              key={cardId}
              className={`transform transition duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              style={{ transitionDelay: `${150 + (index * 100)}ms` }}
            >
              {/* We use the CourseCard component but with enabledFlipping prop */}
              <CourseCard 
                courseCode={cardId} 
                enableFlipping={true}
                inCompareOverlay={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompareOverlay; 