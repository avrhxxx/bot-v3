// src/discord/client.ts
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../config/config';

export type ClientStub = Client;

export async function startDiscord(): Promise<ClientStub> {
  console.log('[Discord] Starting Discord client...');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
    ],
  });

  client.once('ready', () => {
    console.log(`[Discord] Logged in as ${client.user?.tag}`);
  });

  await client.login(config.discordToken); // token z Railway env
  return client;
}