import { NextRequest, NextResponse } from 'next/server';
import TelegramBot, { InlineKeyboardButton, Message, CallbackQuery } from 'node-telegram-bot-api';
import { searchShows, getShowDetails, Show } from '@/lib/tvmaze'; // Assuming tvmaze functions are in src/lib
// No longer need favorite functions here as chat doesn't modify them
// import { addFavorite, removeFavorite, getFavoriteIds, isFavorite } from '@/lib/favorites'; 

// Ensure the bot token is loaded (consider a shared config or env loader)
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
}

// Instantiate the bot
// Note: We don't need { polling: true } anymore when using webhooks
const bot = new TelegramBot(token);

// This function handles POST requests from Telegram
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received Telegram update:', JSON.stringify(body, null, 2));

    if (body.message) {
      await handleMessage(body.message as Message);
    } else {
      // Log other update types if needed
      console.log('Received non-message update type (e.g., callback_query from webapp?):', Object.keys(body));
    }

    // Respond to Telegram confirming receipt of the update
    return NextResponse.json({ status: 'ok' });

  } catch (error: any) {
    console.error('Error processing Telegram update:', error);
    // Try sending an error message to the user if possible
    if (error.chatId) { // Add chatId to errors we throw/catch if needed
        try {
            await bot.sendMessage(error.chatId, "Sorry, an error occurred. Please try again later.");
        } catch (sendError) {
            console.error('Failed to send error message to user:', sendError);
        }
    }
    return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
  }
}

// --- Constants ---
const WEB_APP_PATH = '/tvguide'; // Path to your TV Guide Web App
const ABOUT_TEXT = 'This bot helps you find TV shows and manage your favorites. Built with Next.js and TVMaze API.';

// --- Keyboards ---
const mainKeyboard: InlineKeyboardButton[][] = [
  [
    { text: '🔍 Shows', callback_data: 'tab:shows' },
    { text: '⭐ Favorites', callback_data: 'tab:favs' },
    { text: 'ℹ️ About', callback_data: 'tab:about' },
  ],
  // Add the web app button if configured
  // We'll dynamically add this later based on env var presence
];

function getWebAppUrl(): string | null {
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!webAppUrl) return null;
  return webAppUrl.startsWith('http') ? `${webAppUrl}${WEB_APP_PATH}` : `https://${webAppUrl}${WEB_APP_PATH}`;
}

// --- Utility Functions ---

/** Simple HTML tag stripper */
function stripHtml(html: string | null | undefined): string {
  return html?.replace(/<[^>]*>?/gm, '') || '';
}

/** Formats show details for messages */
function formatShowMessageText(show: Show): string {
    let messageText = `*${show.name}* (ID: ${show.id})\n`;
    if (show.genres?.length) messageText += `_Genres:_ ${show.genres.join(', ')}\n`;
    if (show.network?.name) messageText += `_Network:_ ${show.network.name}\n`;
    if (show.webChannel?.name) messageText += `_Web Channel:_ ${show.webChannel.name}\n`;
    if (show.status) messageText += `_Status:_ ${show.status}\n`;
    if (show.premiered) messageText += `_Premiered:_ ${show.premiered}\n`;
    if (show.rating?.average) messageText += `_Rating:_ ${show.rating.average}\n`;
    if (show.summary) messageText += `\n${stripHtml(show.summary)}\n`;
    // Add link if available
    if (show.officialSite) {
         messageText += `[Official Site](${show.officialSite})\n`;
    }
    return messageText;
}

// --- Main Handler ---
async function handleMessage(message: Message) {
  const chatId = message.chat.id;
  const text = message.text;
  const userId = message.from?.id;

  if (!userId) {
    console.warn('Message received without user ID');
    // Allow processing even without user ID for non-personalized commands
  }

  // Simple command routing
  if (text?.startsWith('/start')) {
    const webAppUrl = getWebAppUrl();
    if (!webAppUrl) {
      await bot.sendMessage(chatId, 'Sorry, the TV Guide app is not configured correctly.');
    } else {
      await bot.sendMessage(chatId, 'Click the button below to open the TV Guide:', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Open TV Guide 📺', web_app: { url: webAppUrl } }]]
        }
      });
    }
  } else if (text === '/guide') {
      // Keep the old /guide functionality
      const webAppUrl = getWebAppUrl();
      if (!webAppUrl) {
        console.error('Error: Web App URL is not set for /guide.');
        await bot.sendMessage(chatId, 'Sorry, the web app URL is not configured correctly.');
      } else {
        await bot.sendMessage(chatId, 'Click the button below to open the TV Guide:', {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Open TV Guide 📺', web_app: { url: webAppUrl } }]
              ]
            }
          });
      }
  } else if (text?.startsWith('/search')) {
    const query = text.split(' ').slice(1).join(' ').trim();
    if (!query) {
      await bot.sendMessage(chatId, 'Usage: `/search <show name>`', { parse_mode: 'MarkdownV2' });
      return;
    }

    await bot.sendMessage(chatId, `Searching for "${query}"...`);
    try {
        const results = await searchShows(query);
        if (results.length === 0) {
            await bot.sendMessage(chatId, `No shows found matching "${query}".`);
            return;
        }

        await bot.sendMessage(chatId, `Found ${results.length} shows (top 5):`);
        for (const result of results.slice(0, 5)) {
            const messageText = formatShowMessageText(result.show); // Use text-only formatter
            // Send without keyboard options
            await bot.sendMessage(chatId, messageText, { parse_mode: 'MarkdownV2', disable_web_page_preview: true }); 
            await new Promise(resolve => setTimeout(resolve, 200)); // Prevent rate limiting
        }
    } catch (error) {
         console.error('Error during search handling:', error);
         await bot.sendMessage(chatId, 'Sorry, an error occurred during the search.');
    }
  } else {
    // Default response for other messages
     const helpMessage = `Unknown command. Use /start or /guide to open the TV Guide app, or /search <query> to find shows.`;
     await bot.sendMessage(chatId, helpMessage); // No keyboard
  }
}

// --- Callback Query Handler ---
// No longer needed as chat buttons (except web_app) are removed.
// async function handleCallbackQuery(callbackQuery: CallbackQuery) { ... }

// IMPORTANT: You need to set the webhook URL for your bot
// This is usually done ONCE using a separate script or curl command,
// pointing to your deployed application's URL + /api/telegram

// Example curl command (replace YOUR_BOT_TOKEN and YOUR_APP_URL):
// curl -F "url=https://YOUR_APP_URL/api/telegram" https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook

// During development, you'll likely need a tool like ngrok to expose your local server
// and provide a public HTTPS URL for the webhook.
// ngrok http 3000
// Then use the ngrok URL in the curl command above. 