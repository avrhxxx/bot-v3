import { startDiscord, ClientStub } from './discord/client';
import { AllianceOrkiestror } from './orkiestror/AllianceOrkiestror';
import { AliasIntegrity } from './integrity/AliasIntegrity';

async function bootstrap() {
  console.log('[Bootstrap] System booting...');

  const client: ClientStub = await startDiscord();
  console.log('[Bootstrap] Discord client started.');

  console.log('[Bootstrap] Initializing alliances...');

  const allianceId = 'alliance1';
  const memberId = 'member1';

  // Dodanie członka + transfer lidera (memory-mode automatycznie tworzy sojusz)
  await AllianceOrkiestror.addMember(allianceId, memberId);
  await AllianceOrkiestror.transferLeader(allianceId, memberId);

  console.log('[Bootstrap] Checking integrity...');
  AliasIntegrity.checkAlliance(allianceId);

  console.log('[Bootstrap] System boot completed. Discord client running.');

  keepAlive();
}

function keepAlive(): void {
  console.log('[Bootstrap] Keeping process alive...');
  setInterval(() => console.log('[Bootstrap] Heartbeat...'), 60_000);
}

bootstrap().catch(err => {
  console.error('[Bootstrap] Fatal boot error:', err);
  process.exit(1);
});