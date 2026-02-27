// src/discord/client.ts
import { Client, GatewayIntentBits } from "discord.js";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once("ready", () => {
  console.log(`Zalogowano jako ${client.user?.tag}`);
});

client.login(process.env.BOT_TOKEN);