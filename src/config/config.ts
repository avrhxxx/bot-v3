// src/config/config.ts
export const BOT_TOKEN = process.env.BOT_TOKEN!;
export const GUILD_ID = process.env.GUILD_ID!;

// Opcjonalnie możesz dodać walidację od razu przy imporcie
if (!BOT_TOKEN) throw new Error("Brak BOT_TOKEN w zmiennych środowiskowych.");
if (!GUILD_ID) throw new Error("Brak GUILD_ID w zmiennych środowiskowych.");