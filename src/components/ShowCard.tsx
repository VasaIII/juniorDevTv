'use client';

import React, { useState } from 'react';
import { Show, Episode } from '@/lib/tvmaze';
import SeasonSelector from './SeasonSelector';
import EpisodeSelector from './EpisodeSelector';

// --- Redefine types for Window/Telegram access (consistency) ---
interface TelegramWebApp {
    initData?: string;
    ready?: () => void; // Make ready optional as we only check initData here
}
interface WindowWithTelegram extends Window {
    Telegram?: {
        WebApp?: TelegramWebApp;
    };
}
// --- End Types ---

// Styles copied from ScheduleItemCard (Consider sharing styles later)
const starButtonStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5em', padding: '0 5px', verticalAlign: 'middle'
};
const episodeButtonStyle: React.CSSProperties = {
    ...starButtonStyle,
    fontSize: '1.3em',
};

// Rename interface
interface ShowCardProps {
    show: Show;
    favoriteIds: Set<number>;
    isTogglingFav: number | null;
    handleToggleFavorite: (showId: number) => void;
    handleFetchShowEpisodesForSeasonSelection: (showId: number) => Promise<Episode[] | null>;
    handleEpisodeSelected: (show: Show, episode: Episode) => void;
}

// Rename component function
export default function ShowCard({ 
    show, 
    favoriteIds, 
    isTogglingFav, 
    handleToggleFavorite, 
    handleFetchShowEpisodesForSeasonSelection, 
    handleEpisodeSelected 
}: ShowCardProps) {
    
    const isFav = favoriteIds.has(show.id);
    const isLoadingFav = isTogglingFav === show.id;
    // Check SDK availability using defined types
    const tgWindow = typeof window !== 'undefined' ? window as WindowWithTelegram : null;
    const canInteract = Boolean(tgWindow?.Telegram?.WebApp?.initData);

    // State for this specific card (Similar to ScheduleItemCard)
    const [isSeasonSelectorOpen, setIsSeasonSelectorOpen] = useState(false);
    const [isEpisodeSelectorOpen, setIsEpisodeSelectorOpen] = useState(false);
    const [selectedSeasonNum, setSelectedSeasonNum] = useState<number | null>(null);
    const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
    const [episodesForSelectedSeason, setEpisodesForSelectedSeason] = useState<Episode[]>([]);
    const [allEpisodesForShow, setAllEpisodesForShow] = useState<Episode[]>([]);
    const [isLoadingSeasons, setIsLoadingSeasons] = useState(false);
    const [seasonLoadError, setSeasonLoadError] = useState<string | null>(null);

    // Handler for clicking the calendar icon (Same as in ScheduleItemCard)
    const handleCalendarClick = async () => {
        if (isSeasonSelectorOpen) {
            setIsSeasonSelectorOpen(false);
            setIsEpisodeSelectorOpen(false);
            setSelectedSeasonNum(null);
            return;
        }
        setIsLoadingSeasons(true);
        setSeasonLoadError(null);
        setIsSeasonSelectorOpen(true); 
        setIsEpisodeSelectorOpen(false);
        setSelectedSeasonNum(null);
        setEpisodesForSelectedSeason([]); 
        if (allEpisodesForShow.length === 0 || seasonLoadError) {
            try {
                const episodes = await handleFetchShowEpisodesForSeasonSelection(show.id);
                if (episodes) {
                    setAllEpisodesForShow(episodes);
                    const seasonNumbers = [...new Set(episodes.map(ep => ep.season))].sort((a, b) => a - b);
                    setAvailableSeasons(seasonNumbers);
                    setSeasonLoadError(null); 
                } else {
                    setAvailableSeasons([]);
                    setSeasonLoadError('Could not load season data.');
                }
            } catch (error) {
                console.error('Error fetching episodes for season selection:', error);
                setSeasonLoadError('Failed to load seasons.');
                setAvailableSeasons([]);
                setAllEpisodesForShow([]); 
            } finally {
                setIsLoadingSeasons(false);
            }
        } else {
            const seasonNumbers = [...new Set(allEpisodesForShow.map(ep => ep.season))].sort((a, b) => a - b);
            setAvailableSeasons(seasonNumbers);
            setIsLoadingSeasons(false); 
        }
    };

    // Handler for when a season is selected (Same as in ScheduleItemCard)
    const onSeasonSelect = (seasonNumber: number) => {
        setSelectedSeasonNum(seasonNumber);
        const episodesForSeason = allEpisodesForShow.filter(ep => ep.season === seasonNumber);
        setEpisodesForSelectedSeason(episodesForSeason);
        setIsEpisodeSelectorOpen(true); 
    };

    // Handler for when an episode is selected (Same as in ScheduleItemCard)
    const onEpisodeSelect = (episode: Episode) => {
        handleEpisodeSelected(show, episode); // Pass the show and selected episode
    };

    return (
        <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
            {show.image?.medium && (
                <img src={show.image.medium} alt={show.name} style={{ marginRight: '15px', width: '60px', height: 'auto' }}/>
             )}
            <div style={{ flexGrow: 1 }}>
                {/* Top section with buttons and title */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <strong style={{ fontSize: '1.1em', display: 'inline-flex', alignItems: 'center' }}>
                     {/* Favorite Button */} 
                     <button 
                        onClick={() => handleToggleFavorite(show.id)}
                        style={starButtonStyle}
                        disabled={isLoadingFav || !canInteract} // Use canInteract check
                        title={canInteract ? (isFav ? 'Remove from Favorites' : 'Add to Favorites') : 'Open via Telegram to favorite'}
                     >
                       {isLoadingFav ? '...' : (isFav ? '⭐' : '☆')}
                     </button>
                     {/* View Seasons/Episodes Button */}
                     <button
                        onClick={handleCalendarClick} // Use the correct handler
                        style={episodeButtonStyle}
                        title="View Seasons & Episodes"
                        disabled={isLoadingSeasons}
                     >
                        {isLoadingSeasons ? '...' : '📅'}
                     </button>
                     <span style={{ marginLeft: '5px' }}>{show.name}</span>
                  </strong>
                </div>
                 {/* Details Section */}
                 <div style={{marginLeft: '10px'}}>
                     {show.genres?.join(', ')} ({show.premiered?.substring(0,4) || 'N/A'}) - {show.status}
                     <br />
                     Rating: {show.rating?.average ? `${show.rating.average}/10` : 'N/A'}
                    {show.summary && (
                       <p style={{ fontSize: '0.9em', color: '#555', marginTop: '5px', overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: show.summary }} />
                    )}
                     {/* Season/Episode Selectors */} 
                     {isSeasonSelectorOpen && (
                        seasonLoadError ? (
                            <p style={{ color: 'red', fontSize: '0.9em', margin: '5px 0 0 10px' }}>{seasonLoadError}</p>
                        ) : (
                            <SeasonSelector 
                                seasonNumbers={availableSeasons}
                                onSelectSeason={onSeasonSelect} 
                                isLoading={isLoadingSeasons}
                            />
                        )
                    )}
                    {isEpisodeSelectorOpen && selectedSeasonNum !== null && (
                         <EpisodeSelector 
                            episodes={episodesForSelectedSeason}
                            onSelectEpisode={onEpisodeSelect}
                            isLoading={isLoadingSeasons} 
                         />
                    )}
                 </div>
            </div>
        </li>
    );
} 