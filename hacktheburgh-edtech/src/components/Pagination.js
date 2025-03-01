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
  
  // Calculate range of page numbers to show
  let startPage = Math.max(1, current - Math.floor(maxPageButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
  
  // Adjust if we're near the end
  if (endPage - startPage + 1 < maxPageButtons) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }
  
  // Generate array of page numbers to display
  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  // Handle page click
  const handlePageClick = (page) => {
    if (page !== current) {
      onPageChange(page);
    }
  };

  // Handle next click
  const handleNextClick = () => {
    if (current < totalPages) {
      onPageChange(current + 1);
    }
  };

  return (
    <nav className="flex justify-center my-8">
      <ul className="flex flex-wrap items-center">
        {pageNumbers.map((page) => (
          <li key={page} className="mx-1">
            <button
              onClick={() => handlePageClick(page)}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                ${
                  page === current
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              aria-current={page === current ? 'page' : undefined}
            >
              {page}
            </button>
          </li>
        ))}
        
        {current < totalPages && (
          <li className="mx-1">
            <button
              onClick={handleNextClick}
              className="px-4 py-2 rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Next
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Pagination; 