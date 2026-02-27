import { AllianceService } from './AllianceServices';

async function bootstrap() {
  console.log('[Bootstrap] System booting...');

  const client: ClientStub = await startDiscord();
  console.log('[Bootstrap] Discord client started.');

  console.log('[Bootstrap] Initializing alliances...');

  // ✅ najpierw create
  await AllianceService.createAlliance('alliance1', 'Test Alliance');

  // potem mutacje
  await AllianceOrkiestror.addMember('alliance1', 'member1');
  await AllianceOrkiestror.transferLeader('alliance1', 'member1');

  console.log('[Bootstrap] Checking integrity...');
  AliasIntegrity.checkAlliance('alliance1');

  console.log('[Bootstrap] System boot completed. Discord client running.');

  keepAlive();
}