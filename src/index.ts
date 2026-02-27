// src/index.ts

import { startDiscord, ClientStub } from './discord/client';
import { AllianceOrchestror } from './system/alliance/orchestrator/AllianceOrchestrator';
import { AliasIntegrity } from './system/alliance/integrity/AllianceIntegrity';

async function bootstrap() {
  console.log('[Bootstrap] System booting...');

  // 1️⃣ Uruchomienie Discord clienta
  const client: ClientStub = await startDiscord();
  console.log('[Bootstrap] Discord client started.');

  // 2️⃣ Inicjalizacja sojuszy
  console.log('[Bootstrap] Initializing alliances...');

  // Bootstrap test data (memory mode safe)
  await AllianceOrchestror.addMember('alliance1', 'member1');
  await AllianceOrchestror.transferLeader('alliance1', 'member1');

  // 3️⃣ Sprawdzenie integralności sojuszu
  console.log('[Bootstrap] Checking integrity...');
  AliasIntegrity.checkAlliance('alliance1');

  console.log('[Bootstrap] System boot completed. Discord client running.');

  // 4️⃣ Keep alive loop
  keepAlive();
}

function keepAlive(): void {
  console.log('[Bootstrap] Keeping process alive...');
  setInterval(() => {
    console.log('[Bootstrap] Heartbeat...');
  }, 60_000);
}

// Start bootstrapa i obsługa fatalnego błędu
bootstrap().catch(err => {
  console.error('[Bootstrap] Fatal boot error:', err);
  process.exit(1);
});