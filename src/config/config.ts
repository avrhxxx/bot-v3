// src/config/config.ts
export const config = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/bot-v3',
  discordToken: process.env.BOT_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '',
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
};