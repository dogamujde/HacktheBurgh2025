import React from 'react';

/**
 * Pagination component for navigating between pages
 * @param {Object} props
 * @param {number} props.currentPage - Current active page (1-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Callback function when page changes
 * @param {number} [props.maxPageButtons=5] - Maximum number of page buttons to display
 */
const Pagination = ({ currentPage, totalPages, onPageChange, maxPageButtons = 5 }) => {
  // Handle empty or invalid props
  if (!totalPages || totalPages <= 1) return null;

  // Ensure current page is valid
  const current = Math.max(1, Math.min(currentPage, totalPages));
  
  // Calculate page numbers to display
  const getPageNumbers = () => {
    // If we have few enough pages to show all
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Always show first and last page
    const pageNumbers = [];
    const leftSiblingIndex = Math.max(current - 1, 1);
    const rightSiblingIndex = Math.min(current + 1, totalPages);
    
    // Whether to show ellipses
    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 1;
    
    // If we're near the start
    if (!showLeftDots && showRightDots) {
      const leftRange = Array.from({ length: maxPageButtons - 1 }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }
    
    // If we're near the end
    if (showLeftDots && !showRightDots) {
      const rightRange = Array.from(
        { length: maxPageButtons - 1 }, 
        (_, i) => totalPages - (maxPageButtons - 2) + i
      );
      return [1, '...', ...rightRange];
    }
    
    // If we're in the middle
    if (showLeftDots && showRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, '...', ...middleRange, '...', totalPages];
    }
  };

  const pageNumbers = getPageNumbers();

  // Handle page click
  const handlePageClick = (page) => {
    if (page !== current && page !== '...') {
      onPageChange(page);
    }
  };

  // Handle previous click
  const handlePrevClick = () => {
    if (current > 1) {
      onPageChange(current - 1);
    }
  };

  // Handle next click
  const handleNextClick = () => {
    if (current < totalPages) {
      onPageChange(current + 1);
    }
  };

  return (
    <nav className="flex justify-center my-8" aria-label="Pagination">
      <ul className="flex flex-wrap items-center gap-2">
        {/* Previous button */}
        <li>
          <button
            onClick={handlePrevClick}
            disabled={current === 1}
            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
              ${current === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            aria-label="Previous page"
          >
            Previous
          </button>
        </li>
        
        {/* Page numbers */}
        {pageNumbers.map((page, index) => (
          <li key={index}>
            {page === '...' ? (
              <span className="px-2 py-1">...</span>
            ) : (
              <button
                onClick={() => handlePageClick(page)}
                className={`w-10 h-10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                  ${
                    page === current
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                aria-current={page === current ? 'page' : undefined}
                aria-label={`Page ${page}`}
              >
                {page}
              </button>
            )}
          </li>
        ))}
        
        {/* Next button */}
        <li>
          <button
            onClick={handleNextClick}
            disabled={current === totalPages}
            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
              ${current === totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            aria-label="Next page"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination; 