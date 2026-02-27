import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { RoleModule } from "./modules/role/RoleModule";
import { ChannelModule } from "./modules/channel/ChannelModule";

const token = process.env.BOT_ID;
if (!token) throw new Error("Brak BOT_ID w env");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`Bot zalogowany jako ${client.user?.tag}`);

  const guild = client.guilds.cache.first();
  if (!guild) return console.log("Bot nie jest w żadnym guildzie");

  // Tworzymy role
  await RoleModule.setupRoles(guild);

  // Tworzymy kategorię i kanały sojuszu
  await ChannelModule.setupAllianceChannels(guild, "sojusz1");
});

client.login(token);