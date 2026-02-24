import dotenv from 'dotenv';

dotenv.config();

if (!process.env.BOT_TOKEN) {
  console.warn('Warning: BOT_TOKEN is not defined in environment variables.');
}

export const config = {
  botToken: process.env.BOT_TOKEN || '',
  port: parseInt(process.env.PORT || '3000', 10),
  maxConcurrentDownloads: 2, // Default limit
};
