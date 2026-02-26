import { startDiscord, ClientStub } from './discord/client';
import { CommandLoader } from './commands/loader/CommandLoader';

async function bootstrap() {
  console.log('System booting...');
  await CommandLoader.loadAllCommands();
  console.log('All commands loaded.');

  const client: ClientStub = await startDiscord();
  console.log('Discord client started.');

  console.log('System boot completed.');
}

bootstrap().catch(err => {
  console.error('Fatal boot error:', err);
  process.exit(1);
});