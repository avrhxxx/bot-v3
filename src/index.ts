// src/index.ts

import { startDiscord, ClientStub } from './discord/client';
import { AllianceOrkiestror } from './orkiestror/AllianceOrkiestror';
import { AliasIntegrity } from './integrity/AliasIntegrity';

async function bootstrap() {
  console.log('[Bootstrap] System booting...');

  // 1️⃣ Uruchomienie klienta Discord
  const client: ClientStub = await startDiscord();
  console.log('[Bootstrap] Discord client started.');

  // 2️⃣ Inicjalizacja sojuszy / test danych
  console.log('[Bootstrap] Initializing alliances...');
  await AllianceOrkiestror.addMember('alliance1', 'member1');
  await AllianceOrkiestror.transferLeader('alliance1', 'member1');

  // 3️⃣ Sprawdzenie integralności sojuszu
  console.log('[Bootstrap] Checking integrity...');
  AliasIntegrity.checkAlliance('alliance1');

  // 4️⃣ Potwierdzenie zakończenia bootu
  console.log('[Bootstrap] System boot completed. Discord client running.');

  // 5️⃣ Utrzymanie procesu w życiu
  keepAlive();
}

function keepAlive(): void {
  console.log('[Bootstrap] Keeping process alive...');
  setInterval(() => {
    console.log('[Bootstrap] Heartbeat...');
  }, 60_000);
}

// Uruchomienie bootstrapa
bootstrap().catch(err => {
  console.error('[Bootstrap] Fatal boot error:', err);
  process.exit(1);
});