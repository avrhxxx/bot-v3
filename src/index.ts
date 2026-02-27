// src/index.ts

import { startDiscord, ClientStub } from './discord/client';
import { AllianceOrkiestror } from './orkiestror/AllianceOrkiestror';
import { AliasIntegrity } from './integrity/AliasIntegrity';

async function bootstrap() {
  console.log('[Bootstrap] System booting...');

  // 1️⃣ Start Discord client
  const client: ClientStub = await startDiscord();
  console.log('[Bootstrap] Discord client started.');

  // 2️⃣ Initialize alliances
  console.log('[Bootstrap] Initializing alliances...');

  const allianceId = 'alliance1';
  const memberId = 'member1';

  // Memory-mode automatycznie tworzy sojusz, jeśli go nie ma
  await AllianceOrkiestror.addMember(allianceId, memberId);
  await AllianceOrkiestror.transferLeader(allianceId, memberId);

  // 3️⃣ Check integrity
  console.log('[Bootstrap] Checking integrity...');
  AliasIntegrity.checkAlliance(allianceId);

  console.log('[Bootstrap] System boot completed. Discord client running.');

  keepAlive();
}

// 4️⃣ Keep process alive
function keepAlive(): void {
  console.log('[Bootstrap] Keeping process alive...');
  setInterval(() => {
    console.log('[Bootstrap] Heartbeat...');
  }, 60_000);
}

// Start bootstrap
bootstrap().catch(err => {
  console.error('[Bootstrap] Fatal boot error:', err);
  process.exit(1);
});