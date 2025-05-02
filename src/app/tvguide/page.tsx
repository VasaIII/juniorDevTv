'use client';

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

  // Effect to set today state
  useEffect(() => {
    setToday(getTodayDateString());
  }, []);

  // Polling Effect for Telegram SDK Check
  useEffect(() => {
    console.log('[Effect Init] Starting polling for Telegram SDK...');
    let attempts = 0;
    const maxAttempts = 15; 
    let foundTg = false;
    const intervalId = setInterval(() => {
        attempts++;
        const tg = (window as any).Telegram?.WebApp;
        if (tg && tg.initData) {
            foundTg = true;
            clearInterval(intervalId);
            console.log(`[Effect Init] Found Telegram SDK & initData after ${attempts * 100}ms.`);
            tg.ready(); 
            fetchInitialFavoriteIds(tg.initData); 
            setFavoritesError(null); 
        } else if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            console.error('[Effect Init] Telegram SDK or initData not found after polling.');
            setFavoritesError('Error on initial load: Could not find Telegram context.');
            setIsFavoritesLoading(false);
        }
    }, 100);
    return () => { if (!foundTg) clearInterval(intervalId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Fetch Initial Favorite IDs 
  const fetchInitialFavoriteIds = useCallback(async (initData: string) => {
    console.log('[fetchInitialFavoriteIds] Fetching...');
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
        console.log('[fetchInitialFavoriteIds] Loaded.');
    } catch (err: any) {
        console.error('Fetch initial fav IDs error:', err);
        // DISTINCT ERROR 2
        setFavoritesError('Error fetching initial favorite status.'); 
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
            const data = await getWebSchedule(today, 'US');
            setSchedule(data);
        } catch (err) {
            setScheduleError('Failed to fetch schedule.');
        } finally {
            setIsScheduleLoading(false);
        }
    }
    if (activeTab === 'shows' && today) fetchSchedule();
  }, [activeTab, today]); 

  // Fetch Full Favorites for Favorites Tab
  const fetchFavorites = useCallback(async () => {
    const tg = (window as any).Telegram?.WebApp;
    // Log before check
    console.log('[fetchFavorites] Checking SDK. window.Telegram.WebApp:', tg); 
    console.log('[fetchFavorites] Checking SDK. typeof tg.initData:', typeof tg?.initData);

    if (!tg || !tg.initData) {
        console.warn('[fetchFavorites] Telegram SDK or initData check FAILED.');
        // DISTINCT ERROR 3
        setFavoritesError('Error loading favorites: Please ensure opened via Telegram button.'); 
        setIsFavoritesLoading(false); return;
    }
    setIsFavoritesLoading(true);
    setFavoritesError(null);
    try {
        const response = await fetch('/api/webapp/favorites', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData }),
         });
        if (!response.ok) throw new Error('Failed to fetch favorites');
        const favData: Show[] = await response.json();
        setFavorites(favData);
        setFavoriteIds(new Set(favData.map(show => show.id))); 
    } catch (err: any) {
        setFavoritesError('Failed to fetch favorites list.'); // Keep specific fetch error
    } finally {
        setIsFavoritesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'favorites') fetchFavorites();
  }, [activeTab, fetchFavorites]);

  // Handle Toggling Favorite Status
  const handleToggleFavorite = async (showId: number) => {
    const tg = (window as any).Telegram?.WebApp;
    // Log before check
    console.log('[handleToggleFavorite] Checking SDK. window.Telegram.WebApp:', tg);
    console.log('[handleToggleFavorite] Checking SDK. typeof tg.initData:', typeof tg?.initData);

    if (!tg || !tg.initData) { 
        console.error('[handleToggleFavorite] SDK or initData check FAILED.');
        // DISTINCT ERROR 4
        alert('Error: Cannot change status. Please ensure opened via Telegram button.'); 
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
        if (!response.ok || !result.success) throw new Error(result.error || 'Failed to toggle');
        if (result.isFavorite !== !currentStatus) {
             console.warn('Backend status mismatch after toggle!');
             setFavoriteIds(prev => {
                const newSet = new Set(prev);
                if (result.isFavorite) newSet.add(showId); else newSet.delete(showId);
                return newSet;
            });
        }
        if (activeTab === 'favorites') fetchFavorites(); 
    } catch (err: any) { 
         console.error('Toggle favorite error:', err);
         alert(`Error toggling favorite: ${err.message || 'Could not update favorite status.'}`);
         setFavoriteIds(prev => {
            const newSet = new Set(prev);
            if (currentStatus) newSet.add(showId); else newSet.delete(showId);
            return newSet;
        });
     } 
    finally { setIsTogglingFav(null); }
  };

  // --- Rendering --- 
  const tabButtonStyle = (tabName: 'shows' | 'favorites' | 'about') => ({ 
       padding: '10px 15px', border: 'none', background: activeTab === tabName ? '#007bff' : '#eee', color: activeTab === tabName ? 'white' : 'black', cursor: 'pointer', marginRight: '5px', borderRadius: '5px 5px 0 0', fontWeight: activeTab === tabName ? 'bold' : 'normal' as 'bold' | 'normal'
   });
  const starButtonStyle = { 
       background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5em', padding: '0 5px', verticalAlign: 'middle'
   };

  // Schedule Item Card (No hasMounted check)
   const ScheduleItemCard = ({ item }: { item: ScheduleItem }) => {
        const show = item._embedded.show;
        const isFav = favoriteIds.has(show.id);
        const isLoadingFav = isTogglingFav === show.id;
        const canInteract = Boolean((window as any).Telegram?.WebApp?.initData); 
        // Log interaction check
        // console.log(`[ScheduleItemCard ${show.id}] canInteract:`, canInteract);
        
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

  return (
    <>
      {/* Re-add Script tag with lazyOnload strategy */}
      <Script 
        src="https://telegram.org/js/telegram-web-app.js" 
        strategy="lazyOnload" // Load after browser idle
        onLoad={() => {
            console.log('[Script Load] Telegram script loaded via next/script (lazyOnload).');
            // Optional: Could trigger a re-check here if needed, but polling should catch it.
        }}
        onError={(e) => {
            console.error('[Script Error] Failed to load Telegram script:', e);
            // Avoid setting state here directly if component hasn't mounted
            // The polling useEffect will handle the error state
        }}
      />
      <Head><title>TV Guide</title></Head>
      <div style={{ padding: '15px', fontFamily: 'sans-serif' }}>
        {/* Tabs */}
        <div style={{ marginBottom: '15px', borderBottom: '1px solid #ccc' }}>
           <button style={tabButtonStyle('shows')} onClick={() => setActiveTab('shows')}>
            Shows
          </button>
          <button style={tabButtonStyle('favorites')} onClick={() => setActiveTab('favorites')}>
            Favorites {favoriteIds.size > 0 ? `(${favoriteIds.size})` : ''}
          </button>
          <button style={tabButtonStyle('about')} onClick={() => setActiveTab('about')}>
            About
          </button>
        </div>
        {/* Content */}
        <div>
          {activeTab === 'shows' && (
            <div> 
              {today && <h2>TV Schedule for {today} (US)</h2>}
              {isScheduleLoading && <p>Loading schedule...</p>}
              {scheduleError && <p style={{ color: 'red' }}>{scheduleError}</p>}
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
