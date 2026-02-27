import { Client, GatewayIntentBits, Message } from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";
import { AllianceService, TEST_ALLIANCE } from "./alliance/AllianceService";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on("messageCreate", async (message: Message) => {
  if (!message.guild || message.author.bot) return;
  if (message.guild.id !== GUILD_ID) return;

  if (message.content === "!create") {
    await message.reply(`✅ Komenda !create użyta — tworzymy sojusz ${TEST_ALLIANCE.name} (testowo).`);
    await AllianceService.createAlliance(message.guild);
  }

  if (message.content === "!delete") {
    await message.reply(`✅ Komenda !delete użyta — usuwamy sojusz ${TEST_ALLIANCE.name} (testowo).`);
    await AllianceService.deleteAlliance(message.guild);
  }
});

client.once("ready", () => {
  console.log(`Zalogowano jako ${client.user?.tag}`);
});

client.login(BOT_TOKEN);