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

const registry = new CommandRegistry();
registry.register(new XsysCommand());

const dispatcher = new Dispatcher(registry);

export async function startDiscord() {
  try {
    console.log("Registering slash commands...");

    const rest = new REST({ version: "10" }).setToken(config.token);

    const commands = registry
      .getAll()
      .map(cmd => cmd.data.toJSON());

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