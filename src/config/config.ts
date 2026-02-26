export const config = {
  mongoUri: process.env.MONGO_URI || '',
  discordToken: process.env.BOT_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || ''
};