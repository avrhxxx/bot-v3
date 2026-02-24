/**
 * ============================================
 * FILE: src/deploy-commands.ts
 * LAYER: DEPLOY / COMMANDS MANAGEMENT
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Deploy wszystkich slash commandów bota Discord
 * - Ładowanie komend dynamicznie z katalogu commands/
 * - Konwersja komend do formatu JSON
 * - Obsługa REST API Discorda
 *
 * ZALEŻNOŚCI:
 * - discord.js (REST, Routes)
 * - src/config/config.ts (tokeny, clientId)
 * - src/commands/loader/CommandLoader.ts
 *
 * FILPATCH:
 * - Dynamiczne pobieranie wszystkich komend zamiast ręcznego importu
 * - Obsługa błędów deployu i logowanie czasów
 *
 * UWAGA ARCHITEKTONICZNA:
 * - Można uruchomić w build/deploy lub osobno dla aktualizacji komend
 *
 * ============================================
 */

import { REST, Routes } from "discord.js";
import { config } from "./config/config";
import { CommandLoader } from "./commands/loader/CommandLoader";

async function deployCommands() {
  console.log("🚀 Starting deployment of slash commands...");

  // 🔹 Dynamiczne pobranie wszystkich komend
  const commandsRaw = await CommandLoader.loadAllCommands();
  const commands = commandsRaw.map(cmd => cmd.data.toJSON());

  const rest = new REST({ version: "10" }).setToken(config.token);

  try {
    console.log(`Deploying ${commands.length} slash command(s) to Discord...`);

    const start = Date.now();
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commands }
    );
    const end = Date.now();

    console.log(`✅ Slash commands deployed successfully (${end - start}ms).`);
  } catch (error) {
    console.error("❌ Failed to deploy slash commands:", error);
  }
}

// Uruchomienie skryptu jako samodzielny proces
deployCommands().catch(err => {
  console.error("Fatal error in deploy-commands.ts:", err);
  process.exit(1);
});