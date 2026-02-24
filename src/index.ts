// ============================================
// FILE: src/index.ts
// LAYER: BOOTSTRAP / ENTRYPOINT
// ============================================
//
// GŁÓWNY PUNKT WEJŚCIA BOTA "bot-v3"
//
// ODPOWIEDZIALNOŚĆ:
// - Inicjalizacja wszystkich modułów systemu
// - Weryfikacja integralności danych sojuszy
// - Uruchomienie SnapshotService, TimeModule, SafeMode
// - Załadowanie wszystkich komend
// - Uruchomienie klienta Discord.js
//
// ZALEŻNOŚCI:
// - system/snapshot/* (IntegrityMonitor, SnapshotService)
// - system/* (Health, SafeMode, Ownership, TimeModule, OwnerModule)
// - data/* (Database, Repositories)
// - engine/* (Dispatcher, MutationGate)
// - commands/* (CommandLoader, CommandRegistry)
// - system/alliance/* (AllianceService, AllianceSystem, TransferLeaderSystem)
//
// FILPATCH:
// - Obsługa zależności modułów w kolejności ładowania
// - Placeholdery dla modułów, które mogą być async inicjalizowane w późniejszym kroku
// - Zachowanie pełnej logiki bootstrappingu i integracji
//
// UWAGA ARCHITEKTONICZNA:
// - NODE_ENV=build → w Railway deploy/build
// - NODE_ENV=production → runtime
// - Operacje mutacyjne wykonuje Orchestrator i MutationGate
//
// ============================================

import path from "path";
import { performance } from "perf_hooks";

import { IntegrityMonitor } from "./system/snapshot/IntegrityMonitor";
import { Health } from "./system/Health";
import { startDiscord } from "./discord/client";
import { SnapshotService } from "./system/snapshot/SnapshotService";
import { SafeMode } from "./system/SafeMode";
import { AllianceRepo, SnapshotRepo, OwnershipRepo } from "./data/Repositories";
import { CommandLoader } from "./commands/loader/CommandLoader";
import { TimeModule } from "./system/TimeModule/TimeModule";

// -------- NOWY FOLDER OWNERSHIP --------
import { Ownership } from "./system/Ownership/Ownership";
import { OwnerRoleManager } from "./system/Ownership/OwnerRoleManager";
import { OwnerModule } from "./system/Ownership/OwnerModule";

// -------------------------
// SET BOT & DISCORD OWNERS FROM ENV
// -------------------------
const BOT_OWNER_ID = process.env.BOT_OWNER_ID;
const DISCORD_OWNER_ID = process.env.DISCORD_OWNER_ID;

if (!BOT_OWNER_ID || !DISCORD_OWNER_ID) {
  console.error("❌ BOT_OWNER_ID or DISCORD_OWNER_ID environment variable is missing.");
  SafeMode.activate("OWNERSHIP_NOT_SET");
} else {
  OwnershipRepo.set("BOT_OWNER", BOT_OWNER_ID);
  OwnershipRepo.set("DISCORD_OWNER", DISCORD_OWNER_ID);
  Ownership.enforceInvariant();
  OwnerModule.init([BOT_OWNER_ID]);
  console.log(`✅ Ownership initialized from environment: BOT_OWNER=${BOT_OWNER_ID}, DISCORD_OWNER=${DISCORD_OWNER_ID}`);
}

// -------------------------
// MODULE DEFINITION
// -------------------------
type ModuleDef = { name: string; importPath: string; dependencies?: string[] };
const modules: ModuleDef[] = [
  { name: 'Health', importPath: './system/Health' },
  { name: 'Ownership', importPath: './system/Ownership/Ownership' },
  { name: 'SafeMode', importPath: './system/SafeMode' },
  { name: 'TimeModule', importPath: './system/TimeModule/TimeModule' },
  { name: 'OwnerModule', importPath: './system/Ownership/OwnerModule' },
  { name: 'Database', importPath: './data/Database' },
  { name: 'Repositories', importPath: './data/Repositories' },
  { name: 'AllianceLock', importPath: './locks/AllianceLock' },
  { name: 'GlobalLock', importPath: './locks/GlobalLock' },
  { name: 'RoleModule', importPath: './system/alliance/modules/role/RoleModule' },
  { name: 'ChannelModule', importPath: './system/alliance/modules/channel/ChannelModule' },
  { name: 'BroadcastModule', importPath: './system/alliance/modules/broadcast/BroadcastModule' },
  { name: 'AllianceSystem', importPath: './system/alliance/AllianceSystem', dependencies: ['RoleModule','ChannelModule','BroadcastModule'] },
  { name: 'TransferLeaderSystem', importPath: './system/alliance/TransferLeaderSystem', dependencies: ['AllianceSystem','RoleModule'] },
  { name: 'IntegrityMonitor', importPath: './system/snapshot/IntegrityMonitor' },
  { name: 'RepairService', importPath: './system/snapshot/RepairService', dependencies: ['IntegrityMonitor'] },
  { name: 'SnapshotService', importPath: './system/snapshot/SnapshotService', dependencies: ['IntegrityMonitor'] },
  { name: 'Dispatcher', importPath: './engine/Dispatcher' },
  { name: 'MutationGate', importPath: './engine/MutationGate', dependencies: ['Dispatcher'] },
  { name: 'AllianceIntegrity', importPath: './system/alliance/integrity/AllianceIntegrity', dependencies: ['AllianceSystem'] },
  { name: 'AllianceOrchestrator', importPath: './system/alliance/orchestrator/AllianceOrchestrator', dependencies: ['RoleModule','ChannelModule','BroadcastModule','AllianceIntegrity'] },
  { name: 'AllianceService', importPath: './system/alliance/AllianceService', dependencies: ['AllianceSystem','AllianceIntegrity','AllianceOrchestrator'] },
  { name: 'DiscordClient', importPath: './discord/client', dependencies: ['AllianceService'] },
  { name: 'Journal', importPath: './journal/Journal', dependencies: ['AllianceSystem'] },
  { name: 'CommandLoader', importPath: './commands/loader/CommandLoader' }
];

// -------------------------
// MODULE IMPORT UTILITIES
// -------------------------
async function importModule(mod: ModuleDef) {
  const start = performance.now();
  try {
    await import(path.resolve(__dirname, mod.importPath + '.ts'));
    const end = performance.now();
    return { ok: true, time: (end-start).toFixed(2) };
  } catch (err) {
    const end = performance.now();
    console.error(`❌ Error loading ${mod.name} (${(end-start).toFixed(2)}ms):`, err);
    return { ok: false, time: (end-start).toFixed(2) };
  }
}

// -------------------------
// MAIN BOOTSTRAP
// -------------------------
async function bootstrap() {
  console.log("System booting...");

  // Inicjalizacja snapshotów sojuszy
  const alliances = AllianceRepo.getAll();
  for (const alliance of alliances) {
    const existing = SnapshotRepo.get(alliance.id);
    if (!existing) {
      SnapshotService.createSnapshot(alliance);
    }
  }

  // Weryfikacja integralności
  const corrupted = SnapshotService.verifyAll();
  if (corrupted.length === 0) {
    Health.setHealthy();
    console.log("Initial integrity check passed.");
  } else {
    Health.setCritical(`Boot integrity failure detected in ${corrupted.length} alliance(s)`);
    SafeMode.activate("Boot integrity failure");
    console.log("Boot integrity failure. SafeMode activated.");
  }

  IntegrityMonitor.start(15000);

  const timeModule = TimeModule.getInstance();
  timeModule.start(1000);
  console.log("TimeModule started.");

  await CommandLoader.loadAllCommands();
  console.log("All commands loaded successfully.");

  // START DISCORD CLIENT
  const client = await startDiscord();
  console.log("Discord client started.");

  // ----------- SYNC OWNER ROLES -----------
  await OwnerRoleManager.syncRoles(client);
  console.log("Owner roles synchronized.");

  console.log("System boot completed. Discord client running.");
}

// Uruchom bootstrap
bootstrap().catch(err => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});