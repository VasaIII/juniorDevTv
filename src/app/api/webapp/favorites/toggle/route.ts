import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { addFavorite, removeFavorite, isFavorite } from '@/lib/favorites';

// Simple interface for expected User structure from initData (consistent with other file)
interface TelegramUser {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    allows_write_to_pm?: boolean;
}

// Reuse the validation logic (consider moving to a shared util if used elsewhere)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Use specific interface for return type
function validateInitData(initData: string, botToken: string): TelegramUser | null {
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        if (!hash) return null; // Hash is required
        const dataToCheck: string[] = [];
        urlParams.sort();
        urlParams.forEach((value, key) => {
            if (key !== 'hash') {
                dataToCheck.push(`${key}=${value}`);
            }
        });
        const dataCheckString = dataToCheck.join('\n');
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
        if (calculatedHash === hash) {
            const userJson = urlParams.get('user');
            // Assume JSON.parse returns a structure matching TelegramUser
            // Explicitly type the parsed object
            return userJson ? JSON.parse(userJson) as TelegramUser : null;
        }
    } catch (error: unknown) { // Catch as unknown
        console.error("Error validating initData:", error);
    }
    return null;
}

// Handle POST requests to toggle favorite status
export async function POST(request: NextRequest) {
    if (!BOT_TOKEN) {
        console.error('TELEGRAM_BOT_TOKEN is not set for favorites validation.');
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { initData, showId } = body;

        if (!initData || typeof showId !== 'number') {
            return NextResponse.json({ error: 'initData and showId (number) are required' }, { status: 400 });
        }

        const user = validateInitData(initData, BOT_TOKEN);
        if (!user || !user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;

        // Check current favorite status
        const currentlyFavorite = await isFavorite(userId, showId);
        let success = false;
        let added = false; // Track if the final state is favorite

        if (currentlyFavorite) {
            // Remove from favorites
            success = await removeFavorite(userId, showId);
            added = false;
        } else {
            // Add to favorites
            // Note: addFavorite expects showId, not the full show object now
            success = await addFavorite(userId, showId);
            added = true;
        }

        if (success) {
            // Return the new favorite status
            return NextResponse.json({ success: true, isFavorite: added }, { status: 200 });
        } else {
            // If add/remove failed unexpectedly after check
            console.error(`Failed to ${currentlyFavorite ? 'remove' : 'add'} favorite for user ${userId}, show ${showId}`);
            return NextResponse.json({ success: false, error: 'Failed to update favorite status' }, { status: 500 });
        }

    } catch (error: unknown) { // Catch as unknown
        console.error('Error toggling favorite status:', error);
         let errorMessage = 'Internal server error';
        // Add explicit type checks
        if (error instanceof SyntaxError) {
            errorMessage = 'Invalid request format';
        } else if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') { // Check if error is a string
            errorMessage = error;
        }
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
} 