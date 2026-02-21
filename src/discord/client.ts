import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";
import { config } from "../config/config";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Test command")
].map(command => command.toJSON());

export async function startDiscord() {
  const rest = new REST({ version: "10" }).setToken(config.token);

  await rest.put(
    Routes.applicationGuildCommands(config.clientId, config.guildId),
    { body: commands }
  );

  client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "ping") {
      await interaction.reply("Pong ✅");
    }
  });

  await client.login(config.token);

  console.log("Discord client ready");
}