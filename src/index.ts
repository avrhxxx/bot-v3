import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { RoleModule } from "./modules/role/RoleModule";
import { ChannelModule } from "./modules/channel/ChannelModule";

const token = process.env.BOT_TOKEN; // Twój token bota
if (!token) throw new Error("Brak BOT_TOKEN w env");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`Bot zalogowany jako ${client.user?.tag}`);

  // Pobieramy pierwszy guild, w którym jest bot
  const guild = client.guilds.cache.first();
  if (!guild) return console.log("Bot nie jest w żadnym guildzie");

  // Tworzymy role
  await RoleModule.ensureRoles(guild);

  // Tworzymy strukturę kanałów dla testowego sojuszu
  await ChannelModule.createChannels(guild, "alliance1", "TAG1", "Sojusz1");

  console.log("Role i struktura kanałów utworzona");
});

client.login(token);