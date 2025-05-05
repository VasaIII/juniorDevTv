import React from 'react';
import { Episode } from '@/lib/tvmaze';

interface EpisodeSelectorProps {
  episodes: Episode[]; // Episodes for the selected season
  onSelectEpisode: (episode: Episode) => void;
  isLoading: boolean; // To disable while parent is loading/processing
}

const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({ 
  episodes, 
  onSelectEpisode, 
  isLoading 
}) => {
  if (episodes.length === 0) {
    return <p style={{ margin: '5px 0 5px 10px', fontSize: '0.9em', color: '#666' }}>No episodes found for this season.</p>;
  }

  // Sort episodes by number
  const sortedEpisodes = [...episodes].sort((a, b) => a.number - b.number);

  const selectStyle: React.CSSProperties = {
    marginTop: '8px',
    marginLeft: '10px',
    padding: '5px 8px',
    fontSize: '0.95em',
    borderRadius: '4px',
    border: '1px solid #ccc',
    width: '90%', // Force consistent width relative to parent
  };

  return (
    <div style={{ marginTop: '5px' }}>
      <label htmlFor="episode-select" style={{ marginLeft: '10px', fontSize: '0.9em', fontWeight: 'bold' }}>Select Episode: </label>
      <select 
        id="episode-select"
        style={selectStyle} 
        onChange={(e) => {
          const selectedEpisodeId = Number(e.target.value);
          const selectedEpisode = sortedEpisodes.find(ep => ep.id === selectedEpisodeId);
          if (selectedEpisode) {
            onSelectEpisode(selectedEpisode);
          }
        }}
        defaultValue="" // Prompt selection
        disabled={isLoading}
      >
        <option value="" disabled>-- Select an Episode --</option>
        {sortedEpisodes.map(ep => (
          <option key={ep.id} value={ep.id} title={`Ep ${ep.number} - ${ep.name}`}>Ep {ep.number} - {ep.name}</option>
        ))}
      </select>
      {/* No separate loading indicator needed here, handled by parent */}
    </div>
  );
};

export default EpisodeSelector; 