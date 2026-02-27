// src/index.ts
import { startDiscord, ClientStub } from './discord/client';
import { AllianceOrkiestror } from './orkiestror/AllianceOrkiestror';
import { AliasIntegrity } from './integrity/AliasIntegrity';
// import { connectMongo } from './mongo/mongoClient';  <-- wyłączamy

async function bootstrap() {
  console.log('[Bootstrap] System booting...');

  // Mongo wyłączone, branch zamrożony

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