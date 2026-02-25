/**
 * ============================================
 * FILE: src/discord/client.ts
 * LAYER: DISCORD CLIENT / BOT INITIALIZATION
 * ============================================
 *
 * RESPONSIBILITIES:
 * - Initialize Discord client
 * - Register commands dynamically
 * - Handle interaction dispatching
 *
 * CHANGES:
 * - Removed deprecated XsysCommand
 * - All commands loaded via CommandLoader / CommandRegistry
 */

import { Client, GatewayIntentBits, REST, Routes, Interaction } from "discord.js";
import { config } from "../config/config";
import { CommandRegistry } from "../commands/CommandRegistry";
import { Dispatcher } from "../engine/Dispatcher";
import { CommandLoader } from "../commands/loader/CommandLoader";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const registry = new CommandRegistry();

// 🔹 Load all commands dynamically
(async () => {
  const allCommands = await CommandLoader.loadAllCommands();
  allCommands.forEach(cmd => registry.register(cmd));
})();

const dispatcher = new Dispatcher(registry);

export async function startDiscord() {
  try {
    console.log("Registering slash commands...");

    const rest = new REST({ version: "10" }).setToken(config.token);

    const commands = registry.getAll().map(cmd => cmd.data.toJSON());

    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    console.log("Slash commands registered successfully.");

    client.on("interactionCreate", async (interaction: Interaction) => {
      if (!interaction.isChatInputCommand()) return;
      await dispatcher.dispatch(interaction);
    });

    await client.login(config.token);

    console.log("Discord client ready");
  } catch (error) {
    console.error("Discord startup error:", error);
  }
}