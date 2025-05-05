import React from 'react';

interface SeasonSelectorProps {
  seasonNumbers: number[];
  onSelectSeason: (seasonNumber: number) => void;
  isLoading: boolean; // To disable select while loading episodes
}

const SeasonSelector: React.FC<SeasonSelectorProps> = ({ 
  seasonNumbers, 
  onSelectSeason, 
  isLoading 
}) => {
  if (seasonNumbers.length === 0) {
    return <p style={{ margin: '5px 0 5px 10px', fontSize: '0.9em', color: '#666' }}>No season data found.</p>;
  }

  const selectStyle: React.CSSProperties = {
    marginTop: '8px',
    marginLeft: '10px',
    padding: '5px 8px',
    fontSize: '0.95em',
    borderRadius: '4px',
    border: '1px solid #ccc',
  };

  return (
    <div style={{ marginTop: '5px' }}>
      <label htmlFor="season-select" style={{ marginLeft: '10px', fontSize: '0.9em', fontWeight: 'bold' }}>Select Season: </label>
      <select 
        id="season-select"
        style={selectStyle} 
        onChange={(e) => onSelectSeason(Number(e.target.value))}
        defaultValue="" // Prompt selection
        disabled={isLoading} // Disable while loading
      >
        <option value="" disabled>-- Select a Season --</option>
        {seasonNumbers.map(num => (
          <option key={num} value={num}>Season {num}</option>
        ))}
      </select>
      {isLoading && <span style={{marginLeft: '5px', fontSize: '0.85em'}}> Loading...</span>}
    </div>
  );
};

export default SeasonSelector; 