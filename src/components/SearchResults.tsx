'use client';

import React from 'react';
import { Show, Episode, SearchResult } from '@/lib/tvmaze';
import ShowCard from '@/components/ShowCard';

interface SearchResultsProps {
  searchQuery: string;
  isSearching: boolean;
  searchError: string | null;
  searchResults: SearchResult[];
  favoriteIds: Set<number>;
  isTogglingFav: number | null;
  handleToggleFavorite: (showId: number) => void;
  handleFetchShowEpisodesForSeasonSelection: (showId: number) => Promise<Episode[] | null>;
  handleEpisodeSelected: (show: Show, episode: Episode) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  searchQuery,
  isSearching,
  searchError,
  searchResults,
  favoriteIds,
  isTogglingFav,
  handleToggleFavorite,
  handleFetchShowEpisodesForSeasonSelection,
  handleEpisodeSelected,
}) => {
  return (
    <div>
      <h2>Search Results for "{searchQuery}"</h2>
      {isSearching && <p>Searching...</p>}
      {searchError && <p style={{ color: 'red' }}>{searchError}</p>}
      {!isSearching && searchResults.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {searchResults.map(({ show }) => (
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
      {/* Handle case where search returned no results but no error occurred */}
      {!isSearching && !searchError && searchResults.length === 0 && searchQuery && (
         <p>No shows found matching "{searchQuery}".</p>
      )}
    </div>
  );
};

export default SearchResults; 