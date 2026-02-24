/**
 * ============================================
 * FILE: src/config/config.ts
 * LAYER: CONFIG / ENVIRONMENT
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Zarządzanie konfiguracją bota Discord
 * - Przechowywanie tokenów, clientId, guildId
 * - Obsługa dodatkowych flag środowiskowych:
 *     - GENERATE_IMPORTS (true/false) -> automatyczne generowanie importów komend
 *     - CHECK_PROCESS   (true/false) -> pre-boot check wszystkich modułów
 * - Walidacja zmiennych środowiskowych przy starcie
 *
 * ZALEŻNOŚCI:
 * - Brak (tylko process.env)
 *
 * FILPATCH:
 * - Dodane nowe zmienne GENERATE_IMPORTS i CHECK_PROCESS
 * - Walidacja natychmiastowa po imporcie
 *
 * ============================================
 */

export const config = {
  token: process.env.BOT_TOKEN as string,
  clientId: process.env.CLIENT_ID as string,
  guildId: process.env.GUILD_ID as string,
  generateImports: process.env.GENERATE_IMPORTS === "true",
  checkProcess: process.env.CHECK_PROCESS === "true",
};

// -------------------------
// Walidacja zmiennych środowiskowych przy starcie
// -------------------------
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