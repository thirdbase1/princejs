import { Bot, InlineKeyboard, InputFile } from 'grammy';
import { config } from './config';
import { getVideoInfo, downloadVideo } from './services/video';
import { splitVideo } from './services/splitter';
import * as store from './utils/store';
import * as queue from './utils/queue';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

if (!config.botToken) {
  console.error('BOT_TOKEN is missing. Please set it in .env file.');
  process.exit(1);
}

export const bot = new Bot(config.botToken);

bot.catch((err) => {
  console.error('Global Error Handler:', err);
});

bot.command('start', (ctx) => {
  ctx.reply('👋 Welcome to the Video Splitter Bot!\n\nSend me a public video URL (YouTube, TikTok, Instagram, etc.) and I will fetch it for you. If it\'s larger than 50MB, I will split it automatically! 🚀');
});

bot.on('message:text', async (ctx) => {
  const url = ctx.message.text.trim();

  if (!url.match(/^https?:\/\//)) return;

  console.log(`Received URL: ${url} from ${ctx.from?.username || ctx.from?.id}`);

  try {
    const statusMsg = await ctx.reply('🔍 *Fetching video info...*', { parse_mode: 'Markdown' });
    console.log('Sent status message');

    const info = await getVideoInfo(url);
    console.log(`Video info fetched: ${info.title}`);
    const requestId = crypto.randomUUID().split('-')[0];
    store.set(requestId, { url, title: info.title, duration: info.duration, thumb: info.thumbnail });

    const keyboard = new InlineKeyboard();
    let buttons = 0;
    for (const f of info.formats) {
        if (buttons >= 8) break;
        const sizeMB = ((f.filesize || f.filesize_approx) / 1024 / 1024).toFixed(1);
        const label = `${f.height}p • ${sizeMB} MB`;
        keyboard.text(label, `dl:${requestId}:${f.height}`).row();
        buttons++;
    }

    if (buttons === 0) {
        if (ctx.chat) {
            await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, '❌ No suitable video formats found.');
        }
        return;
    }

    const escapedTitle = info.title.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
    if (ctx.chat) {
        await ctx.api.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            `🎬 *${escapedTitle}*\n⏱ Duration: ${info.duration}s\n\n👇 *Select Quality:*`,
            { parse_mode: 'MarkdownV2', reply_markup: keyboard }
        );
    }

  } catch (error) {
    console.error('Error in message handler:', error);
    await ctx.reply('❌ Failed to process URL. Ensure it is a valid public video link.');
  }
});

bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;
    if (!data.startsWith('dl:')) return;
    // Check ctx.chat early
    if (!ctx.chat) return;

    const parts = data.split(':');
    if (parts.length < 3) return;

    const requestId = parts[1];
    const height = parseInt(parts[2], 10);

    const context = store.get(requestId);
    if (!context) {
        await ctx.answerCallbackQuery('Session expired. Please send the link again.').catch(() => {});
        return;
    }

    await ctx.answerCallbackQuery('Queued for download...').catch(() => {});
    const statusMsg = await ctx.reply(`⏳ *Queued...* (Position: ${queue.getQueueLength() + 1})`, { parse_mode: 'Markdown' });

    queue.enqueue(async () => {
        try {
            // Use statusMsg.chat.id which is guaranteed to be valid
            const chatId = statusMsg.chat.id;
            const messageId = statusMsg.message_id;

            await ctx.api.editMessageText(chatId, messageId, `⬇️ *Downloading ${height}p video...*`, { parse_mode: 'Markdown' });

            const outputDir = path.resolve('downloads');
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

            const fileName = `video_${requestId}_${height}.mp4`;
            const outputPath = path.join(outputDir, fileName);

            await downloadVideo(context.url, height, outputPath);

            if (!fs.existsSync(outputPath)) {
                throw new Error('Download failed, file not found.');
            }

            const stats = fs.statSync(outputPath);
            const sizeMB = stats.size / (1024 * 1024);

            if (sizeMB > 49.5) {
                await ctx.api.editMessageText(chatId, messageId, `✂️ *Splitting video...* (Size: ${sizeMB.toFixed(1)}MB)`, { parse_mode: 'Markdown' });

                const parts = await splitVideo(outputPath);

                await ctx.api.editMessageText(chatId, messageId, `✅ *Uploading ${parts.length} parts...*`, { parse_mode: 'Markdown' });

                for (let i = 0; i < parts.length; i++) {
                    const partPath = parts[i];
                    await ctx.api.sendVideo(chatId, new InputFile(partPath), {
                        caption: `Part ${i + 1} of ${parts.length}: ${context.title}`,
                        supports_streaming: true,
                    });
                    fs.unlinkSync(partPath);
                }
            } else {
                await ctx.api.editMessageText(chatId, messageId, '✅ *Uploading...*', { parse_mode: 'Markdown' });
                await ctx.api.sendVideo(chatId, new InputFile(outputPath), {
                    caption: context.title,
                    supports_streaming: true,
                });
            }

            // Cleanup
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

            await ctx.api.deleteMessage(chatId, messageId).catch(() => {});

        } catch (error) {
            console.error('Error processing download:', error);
            await ctx.api.editMessageText(statusMsg.chat.id, statusMsg.message_id, '❌ Error processing video. Please try again later.').catch(() => {});
        }
    });
});

// Start the bot
if (require.main === module) {
  console.log('Starting bot...');
  bot.start({
    onStart: (botInfo) => {
      console.log(`Bot @${botInfo.username} started!`);
    },
  }).catch((err) => {
    console.error('Error starting bot:', err);
  });
}
