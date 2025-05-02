import fs from 'fs/promises';
import path from 'path';

const FAVORITES_FILE_PATH = path.join(process.cwd(), 'favorites.json');

// Store show IDs instead of Show objects
interface UserFavorites {
    [userId: number]: number[];
}

// Helper function to read favorites from the file
async function loadFavorites(): Promise<UserFavorites> {
    try {
        await fs.access(FAVORITES_FILE_PATH);
        const data = await fs.readFile(FAVORITES_FILE_PATH, 'utf-8');
        // Add type assertion for safety
        const parsedData = JSON.parse(data);
        // Basic validation: ensure it's an object
        if (typeof parsedData === 'object' && parsedData !== null) {
            // Further validation could be added here to check structure
            return parsedData as UserFavorites;
        } else {
            console.error('Invalid favorites file format. Starting fresh.');
            return {};
        }
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Favorites file not found, starting with empty favorites.');
            return {};
        }
        // Handle JSON parsing errors specifically
        if (error instanceof SyntaxError) {
             console.error('Error parsing favorites JSON:', error);
             return {};
        }
        console.error('Error loading favorites file:', error);
        return {};
    }
}

// Helper function to save favorites to the file
async function saveFavorites(favorites: UserFavorites): Promise<void> {
    try {
        const data = JSON.stringify(favorites, null, 2);
        await fs.writeFile(FAVORITES_FILE_PATH, data, 'utf-8');
    } catch (error) {
        console.error('Error saving favorites file:', error);
    }
}

/**
 * Adds a show ID to a user's favorites list.
 * @param userId - The Telegram user ID.
 * @param showId - The ID of the show to add.
 * @returns True if the show ID was added, false if it was already a favorite.
 */
export async function addFavorite(userId: number, showId: number): Promise<boolean> {
    const favorites = await loadFavorites();
    if (!favorites[userId]) {
        favorites[userId] = [];
    }

    // Check if show ID is already favorited
    if (favorites[userId].includes(showId)) {
        return false; // Already a favorite
    }

    favorites[userId].push(showId);
    await saveFavorites(favorites);
    return true;
}

/**
 * Removes a show ID from a user's favorites list.
 * @param userId - The Telegram user ID.
 * @param showId - The ID of the show to remove.
 * @returns True if the show ID was removed, false if it wasn't found.
 */
export async function removeFavorite(userId: number, showId: number): Promise<boolean> {
    const favorites = await loadFavorites();
    if (!favorites[userId]) {
        return false; // User has no favorites
    }

    const initialLength = favorites[userId].length;
    favorites[userId] = favorites[userId].filter(id => id !== showId);

    // Check if the length actually changed
    if (favorites[userId].length < initialLength) {
        // If the list is now empty, remove the user entry to keep the file clean
        if (favorites[userId].length === 0) {
            delete favorites[userId];
        }
        await saveFavorites(favorites);
        return true; // Show removed
    }

    return false; // Show not found in favorites
}

/**
 * Gets the list of favorite show IDs for a user.
 * @param userId - The Telegram user ID.
 * @returns An array of show IDs, or an empty array if none.
 */
export async function getFavoriteIds(userId: number): Promise<number[]> { // Renamed for clarity
    const favorites = await loadFavorites();
    return favorites[userId] || [];
}

/**
 * Checks if a specific show ID is in a user's favorites.
 * @param userId - The Telegram user ID.
 * @param showId - The ID of the show to check.
 * @returns True if the show ID is a favorite, false otherwise.
 */
export async function isFavorite(userId: number, showId: number): Promise<boolean> {
    const userFavorites = await getFavoriteIds(userId); // Use the renamed function
    return userFavorites.includes(showId);
} 