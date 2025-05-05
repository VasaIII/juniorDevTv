'use client';

import React from 'react';
import { Show, Episode } from '@/lib/tvmaze';
import ShowCard from '@/components/ShowCard';

interface ScheduleViewProps {
  title: string;
  isLoading: boolean;
  error: string | null;
  shows: Show[];
  isFavoritesLoading: boolean;
  favoritesError: string | null;
  favoriteIds: Set<number>;
  isTogglingFav: number | null;
  handleToggleFavorite: (showId: number) => void;
  handleFetchShowEpisodesForSeasonSelection: (showId: number) => Promise<Episode[] | null>;
  handleEpisodeSelected: (show: Show, episode: Episode) => void;
  showLoadMore: boolean;
  handleLoadMore: () => void;
  isLoadMoreLoading: boolean;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({
  title,
  isLoading,
  error,
  shows,
  isFavoritesLoading,
  favoritesError,
  favoriteIds,
  isTogglingFav,
  handleToggleFavorite,
  handleFetchShowEpisodesForSeasonSelection,
  handleEpisodeSelected,
  showLoadMore,
  handleLoadMore,
  isLoadMoreLoading,
}) => {
  const loadMoreButtonStyle: React.CSSProperties = {
    display: 'block',
    width: 'calc(100% - 20px)',
    padding: '10px',
    margin: '20px 10px',
    fontSize: '1em',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    textAlign: 'center',
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...loadMoreButtonStyle,
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  };

  return (
    <div>
      <h2>{title}</h2>
      {isLoading && <p>Loading shows...</p>}
      {error && !isLoadMoreLoading && <p style={{ color: 'red' }}>{error}</p>}
      {!isLoading && isFavoritesLoading && <p>Loading favorite status...</p>}
      {!isLoading && favoritesError && <p style={{ color: 'orange' }}>{favoritesError}</p>}
      {!isLoading && !error && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {shows.length === 0 && !isLoading && <p>No shows found.</p>}
          {shows.map((show) => (
            <ShowCard
              key={show.id}
              show={show}
              favoriteIds={favoriteIds}
              isTogglingFav={isTogglingFav}
              handleToggleFavorite={handleToggleFavorite}
              handleFetchShowEpisodesForSeasonSelection={handleFetchShowEpisodesForSeasonSelection}
              handleEpisodeSelected={handleEpisodeSelected}
            />
          ))}
        </ul>
      )}
      {!isLoading && error && isLoadMoreLoading && <p style={{ color: 'red' }}>{error}</p>}
      {!isLoading && showLoadMore && (
        <button
          onClick={handleLoadMore}
          disabled={isLoadMoreLoading}
          style={isLoadMoreLoading ? disabledButtonStyle : loadMoreButtonStyle}
        >
          {isLoadMoreLoading ? 'Loading...' : 'Load More Shows'}
        </button>
      )}
      {!isLoading && !showLoadMore && shows.length > 0 && (
        <p style={{ textAlign: 'center', margin: '20px 0', color: '#888' }}>End of list.</p>
      )}
    </div>
  );
};

export default ScheduleView; 