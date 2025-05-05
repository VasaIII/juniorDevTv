'use client';

import React from 'react';
import { Show } from '@/lib/tvmaze';
import FavoriteShowCard from '@/components/FavoriteShowCard'; // Assuming this path is correct

interface FavoritesTabProps {
  isFavoritesLoading: boolean;
  favoritesError: string | null;
  favoriteIds: Set<number>; // Keep for consistency or future filtering
  favorites: Show[];
}

const FavoritesTab: React.FC<FavoritesTabProps> = ({
  isFavoritesLoading,
  favoritesError,
  favoriteIds,
  favorites,
}) => {
  return (
    <div>
      <h2>Your Favorites</h2>
      {isFavoritesLoading && <p>Loading favorites...</p>}
      {favoritesError && <p style={{ color: 'red' }}>{favoritesError}</p>}
      {!isFavoritesLoading && !favoritesError && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {favoriteIds.size === 0 && <p>Use the star icon in the Shows tab to add favorites!</p>}
          {favorites.map((show) => (
            <FavoriteShowCard key={show.id} show={show} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default FavoritesTab; 