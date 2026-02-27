import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { RoleModule } from "./orkiestror/RoleModule";
import { ChannelModule } from "./modules/channel/ChannelModule";

const token = process.env.BOT_TOKEN; // lepiej BOT_TOKEN
const guildId = process.env.GUILD_ID;
if (!token) throw new Error("Brak BOT_TOKEN w env");
if (!guildId) throw new Error("Brak GUILD_ID w env");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once("ready", async () => {
  console.log(`Bot zalogowany jako ${client.user?.tag}`);

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return console.error("Nie znaleziono guilda o podanym ID");

  // Tworzymy role
  await RoleModule.ensureRoles(guild);

  // Tworzymy kategorię i kanały sojuszu
  await ChannelModule.setupAllianceChannels(guild, "sojusz1");

  console.log("Setup ról i kanałów zakończony.");
});

client.login(token);