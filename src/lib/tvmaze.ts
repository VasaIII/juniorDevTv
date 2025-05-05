// src/lib/tvmaze.ts
// This file will contain functions to interact with the TVMaze API

import axios from 'axios';

const TVMAZE_API_BASE_URL = 'https://api.tvmaze.com';

// Example function (we'll build this out later)
export async function searchShows(query: string): Promise<SearchResult[]> {
  try {
    const response = await axios.get<SearchResult[]>(
      `${TVMAZE_API_BASE_URL}/search/shows?q=${encodeURIComponent(query)}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error searching TVMaze for "${query}":`, error);
    // Depending on how you want to handle errors, you might re-throw, return empty, etc.
    throw error; // Re-throw for the caller to handle
  }
}

// Add Types for TVMaze API Responses (simplified)
export interface Show {
  id: number;
  url: string;
  name: string;
  type: string;
  language: string;
  genres: string[];
  status: string;
  averageRuntime?: number;
  premiered?: string;
  ended?: string | null;
  officialSite?: string | null;
  schedule?: { time: string; days: string[] };
  rating?: { average: number | null };
  network?: { id: number; name: string; country: { name: string; code: string; timezone: string } };
  webChannel?: { id: number; name: string; country: any | null };
  externals?: { tvrage: number | null; thetvdb: number | null; imdb: string | null };
  image?: { medium: string; original: string };
  summary: string;
  updated: number;
  _embedded?: {
    episodes?: Episode[];
    cast?: CastMember[];
  };
}

// Add interfaces for Cast/Person/Character
export interface Person {
  id: number;
  url: string;
  name: string;
  country?: { name: string; code: string; timezone: string };
  birthday?: string | null;
  deathday?: string | null;
  gender?: string | null;
  image?: { medium: string; original: string };
  updated?: number;
}

export interface Character {
  id: number;
  url: string;
  name: string;
  image?: { medium: string; original: string };
}

export interface CastMember {
  person: Person;
  character: Character;
  self: boolean; // Whether they play themselves
  voice: boolean; // Voice actor
}

// Add a type for the search result item
export interface SearchResult {
  score: number;
  show: Show;
}

// Enhance Episode interface (add optional fields)
export interface Episode {
  id: number;
  url?: string;
  name: string;
  season: number;
  number: number;
  type?: string;
  airdate: string;
  airtime: string;
  airstamp: string;
  runtime: number;
  rating?: { average: number | null };
  image?: { medium: string; original: string };
  summary: string | null;
  _links?: { self: { href: string } };
}

export interface ScheduleItem {
  id: number;
  name: string;
  season: number;
  number: number;
  airdate: string;
  airtime: string;
  airstamp: string;
  runtime: number;
  summary: string;
  _embedded: {
    show: Show;
  };
}

/**
 * Fetches the web schedule from TVMaze for a specific date and country.
 * @param date - The date in YYYY-MM-DD format.
 * @param countryCode - The ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB').
 * @returns An array of schedule items.
 */
export async function getWebSchedule(date: string, countryCode: string = 'GB'): Promise<ScheduleItem[]> {
  try {
    const response = await axios.get<ScheduleItem[]>(
      `${TVMAZE_API_BASE_URL}/schedule/web?date=${date}&country=${countryCode}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching TVMaze web schedule:', error);
    // Depending on how you want to handle errors, you might re-throw, return empty, etc.
    throw error; // Re-throw for the caller to handle
  }
}

/**
 * Fetches detailed information for a specific show by its TVMaze ID, including all episodes and cast.
 * @param showId - The TVMaze ID of the show.
 * @returns A Show object with embedded episodes and cast, or null if not found.
 */
export async function getShowWithEpisodesAndCast(showId: number): Promise<Show | null> {
  try {
    // Embed both episodes and cast
    const response = await axios.get<Show>(
      `${TVMAZE_API_BASE_URL}/shows/${showId}?embed[]=episodes&embed[]=cast`
    );
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      console.log(`Show with ID ${showId} (with episodes/cast) not found on TVMaze.`);
      return null;
    }
    console.error(`Error fetching episodes/cast for show ID ${showId}:`, error);
    throw error; 
  }
}

/**
 * Fetches detailed information for a specific show by its TVMaze ID.
 * @param showId - The TVMaze ID of the show.
 * @returns A Show object or null if not found.
 */
export async function getShowDetails(showId: number): Promise<Show | null> {
  try {
    const response = await axios.get<Show>(
      `${TVMAZE_API_BASE_URL}/shows/${showId}`
    );
    return response.data;
  } catch (error: any) {
    // Handle 404 Not Found specifically
    if (error.response && error.response.status === 404) {
      console.log(`Show with ID ${showId} not found on TVMaze.`);
      return null;
    }
    // Log other errors
    console.error(`Error fetching details for show ID ${showId}:`, error);
    // Depending on how you want to handle errors, you might re-throw, return null, etc.
    throw error; // Re-throw for the caller to handle other errors
  }
}

/**
 * Fetches a paginated list of shows from the TVMaze API.
 * @param page - The page number to fetch (starts from 0).
 * @returns An array of Show objects for the requested page.
 */
export async function getShowsByPage(page: number = 0): Promise<Show[]> {
  try {
    const response = await axios.get<Show[]>(
      `${TVMAZE_API_BASE_URL}/shows?page=${page}`
    );
    return response.data;
  } catch (error: any) {
    // Handle 404 specifically for page not found - API might return 404 for out-of-bounds pages
    if (error.response && error.response.status === 404) {
      console.log(`Page ${page} not found or end of show list reached.`);
      return []; // Return empty array to indicate no more shows
    }
    console.error(`Error fetching shows for page ${page}:`, error);
    throw error; // Re-throw other errors
  }
} 