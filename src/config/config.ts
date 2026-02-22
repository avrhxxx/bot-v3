// src/config/config.ts

export const config = {
  token: process.env.BOT_TOKEN as string,
  clientId: process.env.CLIENT_ID as string,
  guildId: process.env.GUILD_ID as string
};

// Walidacja zmiennych środowiskowych przy starcie
function validateConfig() {
  const missing = [];
  if (!config.token) missing.push("BOT_TOKEN");
  if (!config.clientId) missing.push("CLIENT_ID");
  if (!config.guildId) missing.push("GUILD_ID");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

// Uruchom walidację natychmiast po importowaniu config
validateConfig();