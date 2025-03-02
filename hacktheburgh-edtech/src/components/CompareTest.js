import React from 'react';
import { useCompare } from './CompareContext';

/**
 * Test component to demonstrate that the CompareContext is working
 * You can place this component anywhere in your application to verify
 * that the context is properly accessible
 */
const CompareTest = () => {
  // Access the compare context
  const { compareMode, selectedCards, toggleCompareMode } = useCompare();

  return (
    <div className="p-4 m-4 border rounded shadow-sm bg-gray-50">
      <h3 className="text-lg font-medium mb-2">Compare Context Test</h3>
      
      <div className="mb-2">
        <p>
          Compare Mode: <span className="font-medium">{compareMode ? 'ON' : 'OFF'}</span>
        </p>
        <p>
          Selected Cards: <span className="font-medium">{selectedCards.length}</span>
        </p>
      </div>
      
      <button
        onClick={toggleCompareMode}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {compareMode ? 'Turn Off Compare Mode' : 'Turn On Compare Mode'}
      </button>
      
      <p className="mt-4 text-sm text-gray-600">
        This component confirms that CompareContext is working correctly.
        Try clicking the button and watch the state change.
      </p>
    </div>
  );
};

export default CompareTest; 