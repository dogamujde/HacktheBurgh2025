import React, { createContext, useState, useContext } from 'react';

/**
 * CompareContext and Provider
 * 
 * This context provides functionality for comparing courses/cards.
 * 
 * USAGE EXAMPLES:
 * 
 * 1. Wrap your application with the provider:
 * ```jsx
 * import { CompareProvider } from './components/CompareContext';
 * 
 * function App() {
 *   return (
 *     <CompareProvider>
 *       <YourAppComponents />
 *     </CompareProvider>
 *   );
 * }
 * ```
 * 
 * 2. Use the context in your components:
 * ```jsx
 * import { useCompare } from './components/CompareContext';
 * 
 * function CourseCard({ course }) {
 *   const { compareMode, selectedCards, toggleCompareMode, selectCard } = useCompare();
 *   
 *   const handleSelect = () => {
 *     selectCard(course.id);
 *   };
 *   
 *   return (
 *     <div className={`card ${compareMode && selectedCards.includes(course.id) ? 'selected' : ''}`}>
 *       <h3>{course.name}</h3>
 *       {compareMode && (
 *         <button onClick={handleSelect}>
 *           {selectedCards.includes(course.id) ? 'Selected' : 'Select for comparison'}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 * 
 * 3. Add a compare control component:
 * ```jsx
 * function CompareControls() {
 *   const { compareMode, selectedCards, toggleCompareMode, resetCompare } = useCompare();
 *   
 *   return (
 *     <div className="compare-controls">
 *       <button onClick={toggleCompareMode}>
 *         {compareMode ? 'Exit Compare Mode' : 'Compare Courses'}
 *       </button>
 *       
 *       {compareMode && selectedCards.length > 0 && (
 *         <button onClick={resetCompare}>Clear Selection</button>
 *       )}
 *       
 *       {compareMode && selectedCards.length === 2 && (
 *         <Link to={`/compare/${selectedCards[0]}/${selectedCards[1]}`}>
 *           View Comparison
 *         </Link>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

// Create the Compare context
const CompareContext = createContext();

// Custom hook for accessing the Compare context
export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};

// Provider component
export const CompareProvider = ({ children }) => {
  // State for compare mode and selected cards
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);

  // Toggle compare mode on/off
  const toggleCompareMode = () => {
    // If turning off compare mode, also clear selected cards
    if (compareMode) {
      setSelectedCards([]);
    }
    setCompareMode(!compareMode);
  };

  // Add a card to selected cards if not already at max
  const selectCard = (cardId) => {
    // If not in compare mode or card is already selected, do nothing
    if (!compareMode || selectedCards.includes(cardId)) {
      return;
    }
    
    // If we already have 2 cards selected, do nothing
    if (selectedCards.length >= 2) {
      return;
    }
    
    // Add the card to selected cards
    setSelectedCards([...selectedCards, cardId]);
  };

  // Reset compare mode and clear selected cards
  const resetCompare = () => {
    setSelectedCards([]);
    setCompareMode(false);
  };

  // Value object to provide through context
  const value = {
    compareMode,
    selectedCards,
    toggleCompareMode,
    selectCard,
    resetCompare,
  };

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
};

export default CompareContext; 