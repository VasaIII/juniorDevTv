'use client'; // Ensure this is at the top

import Head from 'next/head';
import Script from 'next/script';
import { useEffect, useState, useCallback } from 'react';
import { getWebSchedule, ScheduleItem, Show } from '@/lib/tvmaze';

// Helper function
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function TvGuideWebApp() {
  // States
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Show[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shows' | 'favorites' | 'about'>('shows');
  const [isTogglingFav, setIsTogglingFav] = useState<number | null>(null);
  // Removed hasMounted state

  // Effect to set today state after component mounts
  useEffect(() => {
    setToday(getTodayDateString());
  }, []);

  // Simplified Effect for Telegram SDK Check - Check immediately on mount
  useEffect(() => {
    console.log('[Effect Init] Component mounted. Checking for Telegram SDK...');
    
    // Log window and potentially Telegram object right away
    try {
        console.log('[Effect Init] Logging window object keys:', Object.keys(window));
        console.log('[Effect Init] window.Telegram object:', (window as any).Telegram);
    } catch (e) {
        console.error('[Effect Init] Error accessing window object parts:', e);
    }

    const tg = (window as any).Telegram?.WebApp;
    console.log('[Effect Init] window.Telegram.WebApp object right after mount:', tg);

    if (tg && tg.initData) {
      console.log('[Effect Init] SDK and initData found immediately on mount.');
      tg.ready();
      fetchInitialFavoriteIds(tg.initData);
      // Clear any previous error if found now
      setFavoritesError(null); 
    } else {
      console.error('[Effect Init] SDK or initData *NOT* found immediately on mount. Functionality depending on it (favorites, stars) may fail.');
      // Set error state to inform the user
      setFavoritesError('Could not connect to Telegram context. Please ensure you opened this from the bot chat button.');
      setIsFavoritesLoading(false); // Ensure loading stops if it was somehow started
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  // Fetch Initial Favorite IDs 
  const fetchInitialFavoriteIds = useCallback(async (initData: string) => {
    console.log('[fetchInitialFavoriteIds] Fetching with provided initData...');
    setIsFavoritesLoading(true);
    setFavoritesError(null);
    try {
      const response = await fetch('/api/webapp/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
      });
      if (!response.ok) throw new Error('Failed to fetch initial favorites');
      const favData: Show[] = await response.json();
      setFavoriteIds(new Set(favData.map(show => show.id)));
      console.log('[fetchInitialFavoriteIds] Initial favorite IDs loaded.');
    } catch (err: any) {
      console.error('Fetch initial fav IDs error:', err);
      setFavoritesError('Could not load favorite status.');
    } finally {
       setIsFavoritesLoading(false);
    }
  }, []);

  // Fetch Schedule for Shows Tab
  useEffect(() => {
    async function fetchSchedule() {
        if (!today) return;
        setIsScheduleLoading(true);
        setScheduleError(null);
        try {
            console.log(`Fetching schedule for ${today}`);
            const data = await getWebSchedule(today, 'US');
            setSchedule(data);
        } catch (err) {
            console.error('Fetch schedule error:', err);
            setScheduleError('Failed to fetch schedule.');
        } finally {
            setIsScheduleLoading(false);
        }
    }
    if (activeTab === 'shows' && today) {
      fetchSchedule();
    }
  }, [activeTab, today]); 

  // Fetch Full Favorites for Favorites Tab
  const fetchFavorites = useCallback(async () => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg || !tg.initData) {
        console.warn('[fetchFavorites] Telegram SDK or initData not found.');
        setFavoritesError('Please open this app through Telegram to view favorites.');
        setIsFavoritesLoading(false);
        setFavorites([]);
        setFavoriteIds(new Set());
        return;
    }
    setIsFavoritesLoading(true);
    setFavoritesError(null);
    try {
      const response = await fetch('/api/webapp/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData }),
      });
      if (!response.ok) {
          let errorMsg = `Error: ${response.status}`; 
          try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch { /* ignore */ }
          throw new Error(errorMsg);
      }
      const favData: Show[] = await response.json();
      setFavorites(favData);
      setFavoriteIds(new Set(favData.map(show => show.id))); 
      console.log('[fetchFavorites] Favorites loaded.');
    } catch (err: any) {
      console.error('Fetch favorites error:', err);
      setFavoritesError(err.message || 'Failed to fetch favorites.');
    } finally {
      setIsFavoritesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'favorites') {
      fetchFavorites();
    }
  }, [activeTab, fetchFavorites]);

  // Handle Toggling Favorite Status
  const handleToggleFavorite = async (showId: number) => {
     // ... (keep existing logic, it checks tg internally) ...
        const tg = (window as any).Telegram?.WebApp;
        if (!tg || !tg.initData) {
            console.error('Cannot toggle favorite: Telegram SDK or initData not found.');
            alert('Cannot change favorite status. Please ensure you opened this via Telegram.');
            return;
        }
        if (isTogglingFav) return;

        setIsTogglingFav(showId);
        const currentStatus = favoriteIds.has(showId);

        setFavoriteIds(prev => {
            const newSet = new Set(prev);
            if (currentStatus) newSet.delete(showId); else newSet.add(showId);
            return newSet;
        });

        try {
            const response = await fetch('/api/webapp/favorites/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: tg.initData, showId }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || 'Failed to toggle favorite');
            if (result.isFavorite !== !currentStatus) {
                 console.warn('Backend status mismatch after toggle!');
                 setFavoriteIds(prev => {
                    const newSet = new Set(prev);
                    if (result.isFavorite) newSet.add(showId); else newSet.delete(showId);
                    return newSet;
                });
            }
            if (activeTab === 'favorites') {
                fetchFavorites(); 
            }
        } catch (err: any) {
            console.error('Toggle favorite error:', err);
            alert(`Error: ${err.message || 'Could not update favorite status.'}`);
            setFavoriteIds(prev => {
                const newSet = new Set(prev);
                if (currentStatus) newSet.add(showId); else newSet.delete(showId);
                return newSet;
            });
        } finally {
            setIsTogglingFav(null);
        }
  };

  // --- Rendering --- 

  // Tab Button Styles
  const tabButtonStyle = (tabName: 'shows' | 'favorites' | 'about') => ({
       padding: '10px 15px', border: 'none', background: activeTab === tabName ? '#007bff' : '#eee', color: activeTab === tabName ? 'white' : 'black', cursor: 'pointer', marginRight: '5px', borderRadius: '5px 5px 0 0', fontWeight: activeTab === tabName ? 'bold' : 'normal' as 'bold' | 'normal'
   });
  // Star Button Style
  const starButtonStyle = {
       background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5em', padding: '0 5px', verticalAlign: 'middle'
   };

  // Schedule Item Card (Removed hasMounted check)
   const ScheduleItemCard = ({ item }: { item: ScheduleItem }) => {
        const show = item._embedded.show;
        const isFav = favoriteIds.has(show.id);
        const isLoadingFav = isTogglingFav === show.id;
        const canInteract = Boolean((window as any).Telegram?.WebApp?.initData); // Still check directly

        return (
            <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                 {show.image?.medium && (
                    <img src={show.image.medium} alt={show.name} style={{ marginRight: '15px', width: '60px', height: 'auto' }}/>
                 )}
                <div style={{ flexGrow: 1 }}>
                    <strong style={{ fontSize: '1.1em' }}>
                         <button 
                            onClick={() => handleToggleFavorite(show.id)}
                            style={starButtonStyle}
                            disabled={isLoadingFav || !canInteract} 
                            title={canInteract ? (isFav ? 'Remove from Favorites' : 'Add to Favorites') : 'Open via Telegram to favorite'}
                        >
                           {isLoadingFav ? '...' : (isFav ? '⭐' : '☆')}
                         </button>
                        {show.name}
                    </strong>
                     <br />
                    <em>S{String(item.season).padStart(2, '0')}E{String(item.number).padStart(2, '0')} - {item.name}</em>
                    <br />
                    Airs at: <strong>{item.airtime}</strong> on {show.network?.name || show.webChannel?.name || 'N/A'}
                    {item.summary && (
                        <p style={{ fontSize: '0.9em', color: '#555' }} dangerouslySetInnerHTML={{ __html: item.summary }} />
                    )}
                </div>
            </li>
        );
   };

  // Favorite Show Card
  const FavoriteShowCard = ({ show }: { show: Show }) => (
       <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
         {show.image?.medium && (
             <img src={show.image.medium} alt={show.name} style={{ marginRight: '15px', width: '60px', height: 'auto' }}/>
         )}
         <div style={{ flexGrow: 1 }}>
             <strong style={{ fontSize: '1.1em' }}>{show.name}</strong>
             {show.network?.name && <span style={{ fontSize: '0.9em', color: '#555' }}> ({show.network.name})</span>}
             <br />
             {show.genres?.length > 0 && <span style={{ fontSize: '0.9em' }}>Genres: {show.genres.join(', ')}<br/></span>}
             {show.status && <span style={{ fontSize: '0.9em' }}>Status: {show.status}<br/></span>}
             {show.summary && (
                 <p style={{ fontSize: '0.9em', color: '#555' }} dangerouslySetInnerHTML={{ __html: show.summary.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' }} />
             )}
             {show.officialSite && 
                 <a href={show.officialSite} target="_blank" rel="noopener noreferrer" style={{fontSize: '0.9em'}}>Official Site</a>
             }
         </div>
     </li>
   );

  // Return the full UI directly (no initial loading state based on hasMounted)
  return (
    <>
       <Head><title>TV Guide</title></Head>

      <div style={{ padding: '15px', fontFamily: 'sans-serif' }}>
        {/* Tab Navigation */}
        {/* ... keep tab buttons ... */}

        {/* Tab Content */}
        <div>
          {/* --- Shows Tab --- */}
          {activeTab === 'shows' && (
            <div>
              {today && <h2>TV Schedule for {today} (US)</h2>}
              {isScheduleLoading && <p>Loading schedule...</p>}
              {scheduleError && <p style={{ color: 'red' }}>{scheduleError}</p>}
              {/* Show fav status loading/error */}
              {isFavoritesLoading && <p>Loading favorite status...</p>}
              {favoritesError && <p style={{ color: 'orange' }}>{favoritesError}</p>}
              
              {!isScheduleLoading && !scheduleError && (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {schedule.length === 0 && !isScheduleLoading && <p>No schedule found for today.</p>}
                  {schedule.map((item) => (
                     <ScheduleItemCard key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* --- Favorites Tab --- */}
          {activeTab === 'favorites' && (
            <div>
              <h2>Your Favorites</h2>
              {isFavoritesLoading && <p>Loading favorites...</p>}
              {favoritesError && <p style={{ color: 'red' }}>{favoritesError}</p>}
              {!isFavoritesLoading && !favoritesError && (
                 <ul style={{ listStyle: 'none', padding: 0 }}>
                    {favoriteIds.size === 0 && favorites.length === 0 && <p>Use the star icon in the Shows tab to add favorites!</p>}
                    {favorites.map((show) => (
                       <FavoriteShowCard key={show.id} show={show} />
                    ))}
                 </ul>
              )}
            </div>
          )}

          {/* --- About Tab --- */}
           {activeTab === 'about' && (
                <div>
                    <h2>About</h2>
                    <p>
                        This is the TV Guide Web App. Find daily schedules and manage your favorite shows.
                    </p>
                </div>
           )}
        </div>
      </div>
    </>
  );
}