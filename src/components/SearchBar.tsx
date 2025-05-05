'use client';

import React from 'react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchType: 'name' | 'genre' | 'actor';
  setSearchType: (type: 'name' | 'genre' | 'actor') => void;
  handleSearch: (e?: React.FormEvent<HTMLFormElement>) => void;
  clearSearch: () => void;
  isSearching: boolean;
  showSearchResults: boolean;
}

// Styles defined locally for encapsulation
const searchContainerStyle: React.CSSProperties = { marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' };
const searchInputStyle: React.CSSProperties = { flexGrow: 1, padding: '8px', fontSize: '1em' };
const searchSelectStyle: React.CSSProperties = { padding: '8px', fontSize: '1em', height: '37px' };
const searchButtonStyle: React.CSSProperties = { padding: '8px 12px', cursor: 'pointer', height: '37px' };

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  searchType,
  setSearchType,
  handleSearch,
  clearSearch,
  isSearching,
  showSearchResults,
}) => {
  return (
    <form onSubmit={handleSearch} style={searchContainerStyle}>
      <select
        value={searchType}
        onChange={(e) => setSearchType(e.target.value as 'name' | 'genre' | 'actor')}
        style={searchSelectStyle}
        title="Select search type"
      >
        <option value="name">By Name</option>
        <option value="genre" disabled>By Genre</option>
        <option value="actor" disabled>By Actor</option>
      </select>

      <input
        type="text"
        placeholder="Search for TV Shows..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={searchInputStyle}
        aria-label="Search query"
      />
      <button
        type="submit"
        style={searchButtonStyle}
        disabled={isSearching || !searchQuery.trim() || searchType !== 'name'} // Disable if not searching by name
      >
        {isSearching ? 'Searching...' : 'Search'}
      </button>
      {showSearchResults && (
        <button type="button" onClick={clearSearch} style={{ ...searchButtonStyle, backgroundColor: '#eee' }}>
          Clear
        </button>
      )}
    </form>
  );
};

export default SearchBar; 