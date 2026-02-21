import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./config/config";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("ready", () => {
  console.log(`Bot zalogowany jako ${client.user?.tag}`);
});

client.login(config.token);
