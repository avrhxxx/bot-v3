// src/index.ts
import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { AllianceOrkiestror } from "./orkiestror/AllianceOrkiestror";

const token = process.env.BOT_ID;
if (!token) throw new Error("Brak BOT_ID w env");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`Bot zalogowany jako ${client.user?.tag}`);

  const guild = client.guilds.cache.first();
  if (!guild) return console.log("Bot nie jest w żadnym guildzie");

  const orkiestror = new AllianceOrkiestror();
  await orkiestror.setupAllianceStub(guild, "alliance1", "TAG1", "Sojusz1");

  console.log("[Index] setupAllianceStub zakończone");
});

client.login(token);