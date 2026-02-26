// src/config/config.ts

export const config = {
  discordToken: process.env.DISCORD_TOKEN || '',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/bot-v3',
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10)
};

// Możesz teraz importować:
// import { config } from './config';