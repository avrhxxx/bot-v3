import { startDiscord, ClientStub } from './discord/client';
import { AllianceOrkiestror } from './orkiestror/AllianceOrkiestror';
import { AliasIntegrity } from './integrity/AliasIntegrity';

async function bootstrap() {
  console.log('[Bootstrap] System booting...');

  // 1️⃣ Start Discord stub
  const client: ClientStub = await startDiscord();
  console.log('[Bootstrap] Discord client started.');

  // 2️⃣ Initialize alliances (stub)
  console.log('[Bootstrap] Initializing alliances...');
  // tutaj możesz w przyszłości załadować z DB lub konfiguracji
  // np. AllianceService.createAlliance('a1', 'Alpha');

  // 3️⃣ Orchestrator przykładowe akcje
  console.log('[Bootstrap] Performing sample orchestration...');
  await AllianceOrkiestror.addMember('alliance1', 'member1');
  await AllianceOrkiestror.transferLeader('alliance1', 'member1');

  // 4️⃣ Integrity check (stub)
  console.log('[Bootstrap] Checking integrity...');
  AliasIntegrity.checkAlliance('alliance1');

  console.log('[Bootstrap] System boot completed. Discord client running.');
}

bootstrap().catch(err => {
  console.error('[Bootstrap] Fatal boot error:', err);
  process.exit(1);
});