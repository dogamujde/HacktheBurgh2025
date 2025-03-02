import React from 'react';
import { useCompare } from './CompareContext';

/**
 * CompareButton Component
 * 
 * A simple button that toggles the compare mode using the CompareContext.
 * The button text and appearance changes based on the current state.
 */
const CompareButton = () => {
  // Use the compare context to access state and toggle function
  const { compareMode, toggleCompareMode } = useCompare();

  return (
    <button
      onClick={toggleCompareMode}
      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded shadow transition-colors"
      aria-label={compareMode ? "Exit compare mode" : "Enter compare mode"}
    >
      {compareMode ? "Exit Compare" : "Compare"}
    </button>
  );
};

export default CompareButton; 