/**
 * ============================================
 * FILE: src/deploy-commands.ts
 * LAYER: DEPLOY / COMMANDS MANAGEMENT
 * ============================================
 *
 * RESPONSIBILITIES:
 * - Deploy all Discord slash commands
 * - Dynamically load commands from commands/ folder
 * - Convert commands to JSON for Discord API
 * - Handle REST deployment errors and log timing
 *
 * DEPENDENCIES:
 * - discord.js (REST, Routes)
 * - config.ts (token, clientId)
 * - CommandLoader.ts (dynamic command loader)
 *
 * NOTES:
 * - Can be run as part of build/deploy process or standalone
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