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

  // Login przy użyciu tokena z Railway env
  await client.login(config.discordToken);
  return client;
}