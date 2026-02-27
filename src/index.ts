import { Client, GatewayIntentBits, Message } from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";
import { createAllianceCommand } from "./commands/createAlliance";
import { deleteAllianceCommand } from "./commands/deleteAlliance";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const commands = [createAllianceCommand, deleteAllianceCommand];

client.on("messageCreate", async (message: Message) => {
  if (!message.guild || message.author.bot) return;
  if (message.guild.id !== GUILD_ID) return;

  const content = message.content.trim();
  commands.forEach(cmd => {
    if (content === `!${cmd.name}`) cmd.execute(message);
  });
});

client.once("ready", () => {
  console.log(`Zalogowano jako ${client.user?.tag}`);
});

client.login(BOT_TOKEN);