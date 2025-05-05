'use client';

import Head from 'next/head';
import Script from 'next/script';
import { useEffect, useState, useCallback } from 'react';
import { Show, Episode, getShowWithEpisodesAndCast, searchShows, SearchResult, getShowsByPage } from '@/lib/tvmaze';

// Import components
import TabNavigation, { Tab } from '@/components/TabNavigation';
import AboutTabContent from '@/components/AboutTabContent';
import EpisodeDetailsModal from '@/components/EpisodeDetailsModal';
import SearchBar from '@/components/SearchBar';
import SearchResults from '@/components/SearchResults';
import ScheduleView from '@/components/ScheduleView';
import FavoritesTab from '@/components/FavoritesTab';

// Define a type for the Telegram WebApp object for better type safety
interface TelegramWebApp {
    initData?: string;
    ready: () => void;
    // Add other properties if needed
}

// Define a type for the Window object including the optional Telegram property
interface WindowWithTelegram extends Window {
    Telegram?: {
        WebApp?: TelegramWebApp;
    };
}

export default function TvGuideWebApp() {
  // --- State Updates ---
  const [displayedShows, setDisplayedShows] = useState<Show[]>([]);
  const [isShowListLoading, setIsShowListLoading] = useState(true);
  const [showListError, setShowListError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Show[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('shows');
  const [isTogglingFav, setIsTogglingFav] = useState<number | null>(null);
  const [selectedShowForEpisodeModal, setSelectedShowForEpisodeModal] = useState<Show | null>(null);
  const [selectedEpisodeForModal, setSelectedEpisodeForModal] = useState<Episode | null>(null);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'genre' | 'actor'>('name');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
  const [hasMoreShows, setHasMoreShows] = useState(true);

  // --- Effects and Handlers ---

  useEffect(() => {
    console.log('[Effect Init] Starting polling for Telegram SDK...');
    let attempts = 0;
    const maxAttempts = 15;
    let foundTg = false;
    const intervalId = setInterval(() => {
        attempts++;
        const tgWindow = window as WindowWithTelegram;
        const tg = tgWindow.Telegram?.WebApp;
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
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(`Failed to fetch initial favorites: ${response.statusText} ${errorBody.error || ''}`.trim());
        }
        const favData: Show[] = await response.json();
        setFavoriteIds(new Set(favData.map(show => show.id)));
        console.log('[fetchInitialFavoriteIds] Loaded.');
    } catch (error: unknown) {
        console.error('Fetch initial fav IDs error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error fetching favorite status.';
        setFavoritesError(`Error fetching initial favorite status: ${message}`);
    } finally {
        setIsFavoritesLoading(false);
    }
  }, []);

  useEffect(() => {
    async function fetchInitialShows() {
      if (activeTab !== 'shows' || showSearchResults) return;
      
      console.log('[ShowList Effect] Fetching initial page (0) of shows...');
      setIsShowListLoading(true);
      setShowListError(null);
      setDisplayedShows([]);
      setCurrentPage(0);
      setHasMoreShows(true);

      try {
        const initialShows = await getShowsByPage(0);
        console.log(`[ShowList Effect] Fetched ${initialShows.length} initial shows.`);
        if (initialShows.length === 0) {
          setHasMoreShows(false);
        }
        setDisplayedShows(initialShows);
      } catch (error: unknown) {
        console.error('[ShowList Effect] Error fetching initial shows:', error);
        const message = error instanceof Error ? error.message : 'Unknown error.';
        setShowListError(`Failed to fetch initial list of shows: ${message}`);
        setHasMoreShows(false);
      } finally {
        setIsShowListLoading(false);
      }
    }

    fetchInitialShows();
  }, [activeTab, showSearchResults]);

  const handleLoadMoreShows = useCallback(async () => {
    if (isLoadMoreLoading || !hasMoreShows) return;

    const nextPage = currentPage + 1;
    console.log(`[Load More] Fetching page ${nextPage}...`);
    setIsLoadMoreLoading(true);
    setShowListError(null);

    try {
      const additionalShows = await getShowsByPage(nextPage);
      console.log(`[Load More] Fetched ${additionalShows.length} additional shows from page ${nextPage}.`);
      if (additionalShows.length > 0) {
        setDisplayedShows(prevShows => [...prevShows, ...additionalShows]);
        setCurrentPage(nextPage);
      } else {
        console.log('[Load More] No more shows found.');
        setHasMoreShows(false);
      }
    } catch (error: unknown) {
      console.error(`[Load More] Error fetching page ${nextPage}:`, error);
      const message = error instanceof Error ? error.message : 'Unknown error.';
      setShowListError(`Failed to load more shows: ${message}`);
    } finally {
      setIsLoadMoreLoading(false);
    }
  }, [currentPage, isLoadMoreLoading, hasMoreShows]);

  const fetchFavorites = useCallback(async () => {
    const tgWindow = window as WindowWithTelegram;
    const tg = tgWindow.Telegram?.WebApp;
    console.log('[fetchFavorites] Checking SDK. window.Telegram.WebApp:', tg);
    console.log('[fetchFavorites] Checking SDK. typeof tg.initData:', typeof tg?.initData);
    if (!tg || !tg.initData) {
        console.warn('[fetchFavorites] Telegram SDK or initData check FAILED.');
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
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(`Failed to fetch favorites: ${response.statusText} ${errorBody.error || ''}`.trim());
        }
        const favData: Show[] = await response.json();
        setFavorites(favData);
        setFavoriteIds(new Set(favData.map(show => show.id)));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error.';
        setFavoritesError(`Failed to fetch favorites list: ${message}`);
    } finally {
        setIsFavoritesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'favorites') fetchFavorites();
  }, [activeTab, fetchFavorites]);

  const handleToggleFavorite = async (showId: number) => {
    const tgWindow = window as WindowWithTelegram;
    const tg = tgWindow.Telegram?.WebApp;
    console.log('[handleToggleFavorite] Checking SDK. window.Telegram.WebApp:', tg);
    console.log('[handleToggleFavorite] Checking SDK. typeof tg.initData:', typeof tg?.initData);
    if (!tg || !tg.initData) {
        console.error('[handleToggleFavorite] SDK or initData check FAILED.');
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
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to toggle favorite status');
        }
        if (result.isFavorite !== !currentStatus) {
             console.warn('Backend status mismatch after toggle!');
             setFavoriteIds(prev => {
                const newSet = new Set(prev);
                if (result.isFavorite) newSet.add(showId); else newSet.delete(showId);
                return newSet;
            });
        }
        if (activeTab === 'favorites') fetchFavorites();
    } catch (error: unknown) {
         const message = error instanceof Error ? error.message : 'Could not update favorite status.';
         console.error('Toggle favorite error:', error);
         alert(`Error toggling favorite: ${message}`);
         setFavoriteIds(prev => {
            const newSet = new Set(prev);
            if (currentStatus) newSet.add(showId); else newSet.delete(showId);
            return newSet;
        });
     }
    finally { setIsTogglingFav(null); }
  };

  const handleFetchShowEpisodesForSeasonSelection = useCallback(async (showId: number): Promise<Episode[] | null> => {
    console.log(`[FetchEpisodesAndCast] Fetching for show ID: ${showId}`);
    try {
      const showWithData = await getShowWithEpisodesAndCast(showId);
      if (!showWithData || !showWithData._embedded?.episodes) {
        console.warn(`[FetchEpisodesAndCast] No episode data found for show ID: ${showId}`);
        return null;
      }
      console.log(`[FetchEpisodesAndCast] Fetched ${showWithData._embedded.episodes.length} episodes for show ID: ${showId}`);
      return showWithData._embedded.episodes;
    } catch (error: unknown) {
      console.error(`[FetchEpisodesAndCast] Error fetching episodes/cast for show ID ${showId}:`, error);
      return null;
    }
  }, []);

  const handleEpisodeSelected = useCallback((show: Show, episode: Episode) => {
    console.log(`[EpisodeSelected] Show: ${show.name}, Episode: S${episode.season}E${episode.number} - ${episode.name}`);
    console.log("[EpisodeSelected] Show object received:", show);
    setSelectedShowForEpisodeModal(show);
    setSelectedEpisodeForModal(episode);
    setIsEpisodeModalOpen(true);
  }, []);

  const handleCloseEpisodeModal = () => {
    setIsEpisodeModalOpen(false);
    setSelectedShowForEpisodeModal(null);
    setSelectedEpisodeForModal(null);
  };

  const handleSearch = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    console.log(`[Search] Type: ${searchType}, Query: "${searchQuery}"`);
    if (searchType !== 'name') {
        alert(`Searching by ${searchType} is not implemented yet.`);
        return;
    }
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setShowSearchResults(true);
    setDisplayedShows([]);
    try {
      const results = await searchShows(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError(`No shows found matching "${searchQuery}".`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error.';
      console.error('[Search] Error:', error);
      setSearchError(`Failed to perform search: ${message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setShowSearchResults(false);
  };

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="lazyOnload"
        onLoad={() => console.log('[Script Load] Telegram script loaded.')}
        onError={(e: unknown) => console.error('[Script Error] Failed to load Telegram script:', e)}
      />
      <Head><title>TV Guide</title></Head>

      <div style={{ padding: '15px', fontFamily: 'sans-serif' }}>
        <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            favoriteCount={favoriteIds.size}
        />

        <div>
          {activeTab === 'shows' && (
            <div>
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchType={searchType}
                setSearchType={setSearchType}
                handleSearch={handleSearch}
                clearSearch={clearSearch}
                isSearching={isSearching}
                showSearchResults={showSearchResults}
              />

              {showSearchResults ? (
                <SearchResults
                  searchQuery={searchQuery}
                  isSearching={isSearching}
                  searchError={searchError}
                  searchResults={searchResults}
                  favoriteIds={favoriteIds}
                  isTogglingFav={isTogglingFav}
                  handleToggleFavorite={handleToggleFavorite}
                  handleFetchShowEpisodesForSeasonSelection={handleFetchShowEpisodesForSeasonSelection}
                  handleEpisodeSelected={handleEpisodeSelected}
                />
              ) : (
                <ScheduleView
                  title="Shows"
                  isLoading={isShowListLoading}
                  error={showListError}
                  shows={displayedShows}
                  isFavoritesLoading={isFavoritesLoading}
                  favoritesError={favoritesError}
                  favoriteIds={favoriteIds}
                  isTogglingFav={isTogglingFav}
                  handleToggleFavorite={handleToggleFavorite}
                  handleFetchShowEpisodesForSeasonSelection={handleFetchShowEpisodesForSeasonSelection}
                  handleEpisodeSelected={handleEpisodeSelected}
                  showLoadMore={hasMoreShows}
                  handleLoadMore={handleLoadMoreShows}
                  isLoadMoreLoading={isLoadMoreLoading}
                />
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <FavoritesTab
              isFavoritesLoading={isFavoritesLoading}
              favoritesError={favoritesError}
              favoriteIds={favoriteIds}
              favorites={favorites}
            />
           )}

          {activeTab === 'about' && <AboutTabContent />}
        </div>
      </div>

      {isEpisodeModalOpen && (
        <EpisodeDetailsModal
          show={selectedShowForEpisodeModal}
          episode={selectedEpisodeForModal}
          onClose={handleCloseEpisodeModal}
        />
      )}
    </>
  );
}
