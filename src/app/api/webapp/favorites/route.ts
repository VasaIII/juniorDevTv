import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getFavoriteIds } from '@/lib/favorites';
import { getShowDetails, Show } from '@/lib/tvmaze';

// Simple interface for expected User structure from initData
interface TelegramUser {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    allows_write_to_pm?: boolean;
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Validates the Telegram WebApp initData string.
 * @param initData - The initData string from the WebApp.
 * @param botToken - Your Telegram bot token.
 * @returns The parsed user object if valid, null otherwise.
 */
// Use specific interface for return type
function validateInitData(initData: string, botToken: string): TelegramUser | null {
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        const dataToCheck: string[] = [];

        // Sort keys alphabetically for data-check-string
        urlParams.sort();

        urlParams.forEach((value, key) => {
            if (key !== 'hash') {
                dataToCheck.push(`${key}=${value}`);
            }
        });

        const dataCheckString = dataToCheck.join('\n');

        // Generate the secret key
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

        // Calculate the validation hash
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        // Compare hashes
        if (calculatedHash === hash) {
            // Data is valid, parse the user object
            const userJson = urlParams.get('user');
            if (userJson) {
                // Assume JSON.parse returns a structure matching TelegramUser
                // Explicitly type the parsed object
                const parsedUser: TelegramUser = JSON.parse(userJson);
                return parsedUser;
            }
        }
    } catch (error: unknown) { // Catch as unknown
        console.error("Error validating initData:", error);
    }
    return null; // Validation failed or error occurred
}

export async function POST(request: NextRequest) {
    if (!BOT_TOKEN) {
        console.error('TELEGRAM_BOT_TOKEN is not set for favorites validation.');
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const initData = body.initData as string;

        if (!initData) {
            return NextResponse.json({ error: 'initData is required' }, { status: 400 });
        }

        // Validate the received initData
        const user = validateInitData(initData, BOT_TOKEN);

        if (!user || !user.id) {
            console.warn('Invalid or missing user data in initData validation');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;

        // Fetch favorite show IDs
        const favIds = await getFavoriteIds(userId);

        if (favIds.length === 0) {
            return NextResponse.json([], { status: 200 }); // Return empty array if no favorites
        }

        // Fetch details for each favorite ID
        // Use Promise.allSettled to handle potential errors for individual shows
        const showDetailPromises = favIds.map(id => getShowDetails(id));
        const results = await Promise.allSettled(showDetailPromises);

        const favoriteShows: Show[] = results
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => (result as PromiseFulfilledResult<Show>).value);

        // Return the array of favorite shows
        return NextResponse.json(favoriteShows, { status: 200 });

    } catch (error: unknown) { // Catch as unknown
        console.error('Error fetching favorites for webapp:', error);
        // Avoid leaking detailed errors
        let errorMessage = 'Internal server error';
        // Check error type before accessing properties
        if (error instanceof SyntaxError) { // Handle potential JSON parsing errors from request body
            errorMessage = 'Invalid request format';
        } else if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 