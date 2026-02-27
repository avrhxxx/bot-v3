// src/index.ts
import { Client, GatewayIntentBits, Message } from "discord.js";
import { BOT_TOKEN, GUILD_ID } from "./config/config";
import { AllianceService, TEST_ALLIANCE } from "./allianceSystem/AllianceService";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const logTime = (msg: string) => {
  const now = new Date();
  const time = now.toISOString().substring(11, 19);
  console.log(`[${time}] ${msg}`);
};

client.once("ready", () => {
  logTime(`Zalogowano jako ${client.user?.tag}`);
});

// -------------------
// OBSŁUGA WIADOMOŚCI
// -------------------
client.on("messageCreate", async (message: Message) => {
  if (!message.guild || message.author.bot) return;
  if (message.guild.id !== GUILD_ID) return;

  // -------------------
  // !create
  // -------------------
  if (message.content === "!create") {
    await message.reply(`✅ Komenda !create użyta — rozpoczynam tworzenie sojuszu **${TEST_ALLIANCE.name} · ${TEST_ALLIANCE.tag}**.`);
    logTime(`🚀 Użytkownik ${message.author.tag} wywołał !create`);
    AllianceService.createAlliance(message.guild).then(() => {
      logTime(`🎉 Sojusz ${TEST_ALLIANCE.name} w pełni utworzony!`);
    }).catch(err => {
      logTime(`❌ Błąd podczas tworzenia sojuszu: ${err}`);
    });
  }

  // -------------------
  // !delete
  // -------------------
  if (message.content === "!delete") {
    await message.reply(`✅ Komenda !delete użyta — rozpoczynam usuwanie sojuszu **${TEST_ALLIANCE.name} · ${TEST_ALLIANCE.tag}**.`);
    logTime(`🗑 Użytkownik ${message.author.tag} wywołał !delete`);
    AllianceService.deleteAlliance(message.guild).then(() => {
      logTime(`✅ Sojusz ${TEST_ALLIANCE.name} został w pełni usunięty.`);
    }).catch(err => {
      logTime(`❌ Błąd podczas usuwania sojuszu: ${err}`);
    });
  }
});

client.login(BOT_TOKEN);