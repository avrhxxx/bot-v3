import { startDiscord, ClientStub } from './discord/client';
import { AllianceOrkiestror } from './orkiestror/AllianceOrkiestror';
import { AliasIntegrity } from './integrity/AliasIntegrity';
import { connectMongo } from './mongo/mongoClient';

async function bootstrap() {
  console.log('[Bootstrap] System booting...');

  await connectMongo();

  const client: ClientStub = await startDiscord();
  console.log('[Bootstrap] Discord client started.');

  console.log('[Bootstrap] Initializing alliances...');
  await AllianceOrkiestror.addMember('alliance1', 'member1');
  await AllianceOrkiestror.transferLeader('alliance1', 'member1');

  console.log('[Bootstrap] Checking integrity...');
  AliasIntegrity.checkAlliance('alliance1');

  console.log('[Bootstrap] System boot completed. Discord client running.');

  await keepAlive();
}

async function keepAlive(): Promise<void> {
  console.log('[Bootstrap] Keeping process alive...');
  setInterval(() => console.log('[Bootstrap] Heartbeat...'), 60_000);
  return new Promise(() => {});
}

bootstrap().catch(err => {
  console.error('[Bootstrap] Fatal boot error:', err);
  process.exit(1);
});