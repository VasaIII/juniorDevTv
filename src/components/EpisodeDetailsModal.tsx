import React from 'react';
import { Show, Episode } from '@/lib/tvmaze';

interface EpisodeDetailsModalProps {
  show: Show | null; // Show context (for name mainly)
  episode: Episode | null; // The specific episode to display
  onClose: () => void;
}

const EpisodeDetailsModal: React.FC<EpisodeDetailsModalProps> = ({ 
  show, 
  episode, 
  onClose 
}) => {
  if (!episode || !show) return null; // Need both show and episode

  const modalStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1100, // Higher z-index
    padding: '20px',
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: '#fff', padding: '25px 35px', borderRadius: '8px',
    maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', 
    position: 'relative', color: '#333', 
    boxShadow: '0 5px 20px rgba(0,0,0,0.25)',
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute', top: '10px', right: '15px',
    background: 'none', border: 'none', fontSize: '1.8rem', 
    cursor: 'pointer', color: '#aaa', lineHeight: 1,
  };

  const detailRowStyle: React.CSSProperties = {
    marginBottom: '12px', 
    lineHeight: 1.5, 
  };

  const detailLabelStyle: React.CSSProperties = {
    fontWeight: 'bold', 
    minWidth: '100px', // Align labels somewhat
    display: 'inline-block',
  };

  const summaryStyle: React.CSSProperties = {
     fontSize: '0.95em', 
     marginTop: '15px',
     paddingTop: '10px',
     borderTop: '1px solid #eee',
     lineHeight: 1.6,
   };

  const castListStyle: React.CSSProperties = {
    marginTop: '15px',
    paddingTop: '10px',
    borderTop: '1px solid #eee',
  };

  const castItemStyle: React.CSSProperties = {
    fontSize: '0.9em',
    marginBottom: '4px',
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeButtonStyle} onClick={onClose} title="Close">&times;</button>
        
        <h2 style={{ 
            marginTop: '0', 
            marginBottom: '5px', // Less space below show title
            fontSize: '1.8rem', // Larger show title
            fontWeight: 600, // Slightly bolder
            color: '#222'
        }}>{show.name}</h2>
        
        <h3 style={{ 
            marginTop: '0', // Remove top margin
            marginBottom: '25px', // More space below subtitle before details
            borderBottom: '1px solid #eee', 
            paddingBottom: '12px', 
            color: '#555', // Softer color for subtitle
            fontSize: '1.1rem', // Adjust size as needed
            fontWeight: 400 // Normal weight
        }}>
          S{String(episode.season).padStart(2, '0')}E{String(episode.number).padStart(2, '0')} - {episode.name}
        </h3>

        {episode.image?.medium && (
            <img 
                src={episode.image.medium} 
                alt={`Episode ${episode.season}x${episode.number}`} 
                style={{ float: 'right', marginLeft: '15px', marginBottom: '10px', maxWidth: '150px', borderRadius: '4px' }}
            />
        )}
        
        <div style={detailRowStyle}>
            <span style={detailLabelStyle}>Air Date:</span> 
            {episode.airdate || 'N/A'} at {episode.airtime || 'N/A'}
        </div>
        <div style={detailRowStyle}>
            <span style={detailLabelStyle}>Runtime:</span> 
            {episode.runtime ? `${episode.runtime} minutes` : 'N/A'}
        </div>
        {episode.rating?.average && (
             <div style={detailRowStyle}>
                 <span style={detailLabelStyle}>Rating:</span> 
                 {episode.rating.average} / 10
             </div>
        )}
        {episode.url && (
            <div style={detailRowStyle}>
                <span style={detailLabelStyle}>More Info:</span> 
                <a href={episode.url} target="_blank" rel="noopener noreferrer">TVMaze Link</a>
            </div>
        )}

        {episode.summary && (
            <div style={summaryStyle} dangerouslySetInnerHTML={{ __html: episode.summary }} />
        )}
        {!episode.summary && <p style={{ ...summaryStyle, borderTop: 'none', color: '#777' }}>No summary available.</p>} 

        {show._embedded?.cast && show._embedded.cast.length > 0 && (
          <div style={castListStyle}>
            <h4 style={{ marginBottom: '8px' }}>Cast</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '5px' }}>
              {show._embedded.cast.map(({ person, character }) => (
                <li key={person.id} style={castItemStyle}>
                  <strong>{person.name}</strong> as {character.name}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
};

export default EpisodeDetailsModal; 