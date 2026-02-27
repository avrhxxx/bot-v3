// src/index.ts

import { startDiscord, ClientStub } from './discord/client';
import { AllianceOrkiestror } from './orkiestror/AllianceOrkiestror';
import { AliasIntegrity } from './system/alliance/integrity/AllianceIntegrity';

async function bootstrap() {
  console.log('[Bootstrap] System booting...');

  // 1️⃣ Start klienta Discord
  const client: ClientStub = await startDiscord();
  console.log('[Bootstrap] Discord client started.');

  // 2️⃣ Inicjalizacja sojuszy
  console.log('[Bootstrap] Initializing alliances...');

  // ⚠️ Bootstrap test data (memory-safe)
  try {
    await AllianceOrkiestror.addMember('alliance1', 'member1');
    await AllianceOrkiestror.transferLeader('alliance1', 'member1');
  } catch (err) {
    console.warn('[Bootstrap] Skipping bootstrap member/leader setup:', err);
  }

  // 3️⃣ Sprawdzenie integralności
  try {
    AliasIntegrity.checkAlliance('alliance1');
  } catch (err) {
    console.warn('[Bootstrap] Integrity check failed:', err);
  }

  console.log('[Bootstrap] System boot completed. Discord client running.');

  keepAlive();
}

function keepAlive(): void {
  console.log('[Bootstrap] Keeping process alive...');
  setInterval(() => {
    console.log('[Bootstrap] Heartbeat...');
  }, 60_000);
}

// Start bootstrapping
bootstrap().catch(err => {
  console.error('[Bootstrap] Fatal boot error:', err);
  process.exit(1);
});