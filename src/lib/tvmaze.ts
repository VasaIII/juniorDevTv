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
}

// Add a type for the search result item
interface SearchResult {
  score: number;
  show: Show;
}

interface Episode {
  id: number;
  name: string;
  season: number;
  number: number;
  airdate: string;
  airtime: string;
  airstamp: string;
  runtime: number;
  summary: string;
}

export interface ScheduleItem {
  id: number;
  name: string; // Episode Name
  season: number;
  number: number;
  airdate: string;
  airtime: string;
  airstamp: string; // ISO 8601 timestamp
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
export async function getWebSchedule(date: string, countryCode: string = 'US'): Promise<ScheduleItem[]> {
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