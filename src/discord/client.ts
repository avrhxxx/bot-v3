import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Interaction
} from "discord.js";

import { config } from "../config/config";
import { CommandRegistry } from "../commands/CommandRegistry";
import { Dispatcher } from "../engine/Dispatcher";
import { XsysCommand } from "../commands/XsysCommand";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

export async function startDiscord() {
  try {
    // 🔹 Rejestr komend
    const registry = new CommandRegistry();
    registry.register(new XsysCommand());

    // 🔹 Dispatcher
    const dispatcher = new Dispatcher(registry);

    // 🔹 Deploy slash commands (guild – szybkie odświeżanie)
    const rest = new REST({ version: "10" }).setToken(config.token);

    console.log("Deploying slash commands...");

    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      {
        body: registry.getAll().map(cmd => cmd.data.toJSON())
      }
    );

    console.log("Slash commands deployed.");

    // 🔹 Interaction handler
    client.on("interactionCreate", async (interaction: Interaction) => {
      if (!interaction.isChatInputCommand()) return;

      await dispatcher.dispatch(interaction);
    });

    await client.login(config.token);

    console.log("Discord client ready.");
  } catch (error) {
    console.error("Discord startup error:", error);
  }
}