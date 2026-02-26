import { startDiscord, ClientStub } from './discord/client';
import { AllianceOrkiestror } from './orkiestror/AllianceOrkiestror';
import { AliasIntegrity } from './integrity/AliasIntegrity';

async function bootstrap() {
  console.log('[Bootstrap] System booting...');

  // 1️⃣ Start Discord client
  const client: ClientStub = await startDiscord();
  console.log('[Bootstrap] Discord client started.');

  // 2️⃣ Initialize alliances (stub)
  console.log('[Bootstrap] Initializing alliances...');
  // tu możesz w przyszłości załadować sojusze z DB

  // 3️⃣ Sample orchestration
  console.log('[Bootstrap] Performing sample orchestration...');
  await AllianceOrkiestror.addMember('alliance1', 'member1');
  await AllianceOrkiestror.transferLeader('alliance1', 'member1');

  // 4️⃣ Integrity check
  console.log('[Bootstrap] Checking integrity...');
  AliasIntegrity.checkAlliance('alliance1');

  console.log('[Bootstrap] System boot completed. Discord client running.');
  console.log('[Bootstrap] Bot is active on Railway.');

  // 5️⃣ Keep process alive
  await keepAlive();
}

/**
 * Keeps the process alive for Railway so it shows "active"
 */
async function keepAlive(): Promise<void> {
  console.log('[Bootstrap] Keeping process alive...');
  setInterval(() => {
    console.log('[Bootstrap] Heartbeat...');
  }, 60_000);

  // Blokujemy funkcję, aby Node nie zakończył procesu
  return new Promise(() => {});
}

bootstrap().catch(err => {
  console.error('[Bootstrap] Fatal boot error:', err);
  process.exit(1);
});