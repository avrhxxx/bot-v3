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
// - Załadowanie wszystkich komend
// - Uruchomienie klienta Discord.js
// - Synchronizacja ról Shadow Authority
//
// ZALEŻNOŚCI:
// - system/* (Ownership)
// - data/* (Database, Repositories)
// - engine/* (Dispatcher, MutationGate)
// - commands/* (CommandLoader, CommandRegistry)
// - system/alliance/* (AllianceService, AllianceSystem, TransferLeaderSystem)
//
// UWAGA ARCHITEKTONICZNA:
// - NODE_ENV=build → Railway deploy/build
// - NODE_ENV=production → runtime
// - Operacje mutacyjne wykonuje Orchestrator i MutationGate
//
// ============================================

import path from "path";
import { performance } from "perf_hooks";

import { startDiscord } from "./discord/client";
import { AllianceRepo, SnapshotRepo } from "./data/Repositories";
import { CommandLoader } from "./commands/loader/CommandLoader";

// -------- NOWY FOLDER OWNERSHIP --------
import { Ownership } from "./system/Ownership/Ownership";

// -------------------------
// INIT SHADOW AUTHORITY FROM ENV
// -------------------------
const authorityEnv = process.env.AUTHORITY_IDS || ""; // max 2 IDs, comma-separated
const authorityIds = authorityEnv.split(",").map(s => s.trim()).filter(Boolean).slice(0, 2);

if (authorityIds.length === 0) {
  console.error("❌ AUTHORITY_IDS environment variable is missing or empty.");
  // SafeMode no longer exists → można rzucić błąd lub zatrzymać bootstrap
  process.exit(1);
}

Ownership.initFromEnv(); // Inicjalizuje z AUTHORITY_IDS
console.log(`✅ Shadow Authority initialized from environment: ${authorityIds.join(", ")}`);

// -------------------------
// MODULE DEFINITION
// -------------------------
type ModuleDef = { name: string; importPath: string; dependencies?: string[] };
const modules: ModuleDef[] = [
  { name: 'Ownership', importPath: './system/Ownership/Ownership' },
  { name: 'Database', importPath: './data/Database' },
  { name: 'Repositories', importPath: './data/Repositories' },
  { name: 'AllianceLock', importPath: './locks/AllianceLock' },
  { name: 'GlobalLock', importPath: './locks/GlobalLock' },
  { name: 'RoleModule', importPath: './system/alliance/modules/role/RoleModule' },
  { name: 'ChannelModule', importPath: './system/alliance/modules/channel/ChannelModule' },
  { name: 'BroadcastModule', importPath: './system/alliance/modules/broadcast/BroadcastModule' },
  { name: 'AllianceSystem', importPath: './system/alliance/AllianceSystem', dependencies: ['RoleModule','ChannelModule','BroadcastModule'] },
  { name: 'TransferLeaderSystem', importPath: './system/alliance/TransferLeaderSystem', dependencies: ['AllianceSystem','RoleModule'] },
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
      // SnapshotService został usunięty → pomijamy
    }
  }

  // TODO: Health checks / SafeMode logika usunięta

  await CommandLoader.loadAllCommands();
  console.log("All commands loaded successfully.");

  // START DISCORD CLIENT
  const client = await startDiscord();
  console.log("Discord client started.");

  // ----------- SYNC SHADOW AUTHORITY ROLES -----------
  await Ownership.syncRoles(client);
  console.log("Shadow Authority roles synchronized.");

  console.log("System boot completed. Discord client running.");
}

// Uruchom bootstrap
bootstrap().catch(err => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});