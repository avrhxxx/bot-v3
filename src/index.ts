/**
 * ============================================
 * FILE: src/index.ts
 * LAYER: BOOTSTRAP / ENTRYPOINT
 * ============================================
 *
 * GŁÓWNY PUNKT WEJŚCIA BOTA "bot-v3"
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Inicjalizacja wszystkich modułów systemu
 * - Weryfikacja integralności danych sojuszy
 * - Uruchomienie SnapshotService, TimeModule, SafeMode
 * - Załadowanie wszystkich komend
 * - Uruchomienie klienta Discord.js
 *
 * ZALEŻNOŚCI:
 * - system/snapshot/* (IntegrityMonitor, SnapshotService)
 * - system/* (Health, SafeMode, Ownership, TimeModule, OwnerModule)
 * - data/* (Database, Repositories)
 * - engine/* (Dispatcher, MutationGate)
 * - commands/* (CommandLoader, CommandRegistry)
 * - system/alliance/* (AllianceService, AllianceSystem, TransferLeaderSystem)
 *
 * FILPATCH:
 * - Obsługa zależności modułów w kolejności ładowania
 * - Placeholdery dla modułów, które mogą być async inicjalizowane w późniejszym kroku
 * - Zachowanie pełnej logiki bootstrappingu i integracji
 *
 * UWAGA ARCHITEKTONICZNA:
 * - NODE_ENV=build → w Railway deploy/build
 * - NODE_ENV=production → runtime
 * - Operacje mutacyjne wykonuje Orchestrator i MutationGate
 *
 * ============================================
 */

import { IntegrityMonitor } from "./system/snapshot/IntegrityMonitor";
import { Health } from "./system/Health";
import { startDiscord } from "./discord/client";
import { SnapshotService } from "./system/snapshot/SnapshotService";
import { SafeMode } from "./system/SafeMode";
import { AllianceRepo, SnapshotRepo } from "./data/Repositories";
import { CommandLoader } from "./commands/loader/CommandLoader";
import { TimeModule } from "./system/TimeModule/TimeModule";
import { performance } from "perf_hooks";
import path from "path";

// -------------------------
// ENVIRONMENT CHECK
// -------------------------
const RUN_CHECK_PROCESS = process.env.NODE_ENV === "build";

// -------------------------
// MODULE DEFINITION
// -------------------------
type ModuleDef = { name: string; importPath: string; dependencies?: string[] };
const modules: ModuleDef[] = [
  { name: 'Health', importPath: './system/Health' },
  { name: 'Ownership', importPath: './system/Ownership' },
  { name: 'SafeMode', importPath: './system/SafeMode' },
  { name: 'TimeModule', importPath: './system/TimeModule/TimeModule' },
  { name: 'OwnerModule', importPath: './system/OwnerModule/OwnerModule' },
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
  { name: 'CommandDispatcher', importPath: './system/alliance/CommandDispatcher/CommandDispatcher', dependencies: ['OwnerModule'] },
  { name: 'AllianceIntegrity', importPath: './system/alliance/integrity/AllianceIntegrity', dependencies: ['AllianceSystem'] },
  { name: 'AllianceOrchestrator', importPath: './system/alliance/orchestrator/AllianceOrchestrator', dependencies: ['RoleModule','ChannelModule','BroadcastModule','AllianceIntegrity'] },
  { name: 'AllianceService', importPath: './system/alliance/AllianceService', dependencies: ['AllianceSystem','AllianceIntegrity','AllianceOrchestrator'] },
  { name: 'DiscordClient', importPath: './discord/client', dependencies: ['AllianceService','CommandDispatcher'] },
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
    return { ok: true, time: (end - start).toFixed(2) };
  } catch (err) {
    const end = performance.now();
    console.error(`❌ Error loading ${mod.name} (${(end-start).toFixed(2)}ms):`, err);
    return { ok: false, time: (end - start).toFixed(2) };
  }
}

function logProgress(current: number, total: number) {
  const percent = Math.floor((current / total) * 100);
  process.stdout.write(`\r🔹 Progress: ${percent}% (${current}/${total})`);
}

async function runCheckProcess() {
  console.log('\n🛠️  Pre-Boot Check Process Starting...\n');
  const totalModules = modules.length;
  let loadedModules: string[] = [];

  for (let i = 0; i < totalModules; i++) {
    const mod = modules[i];
    let depsOk = true;

    if (mod.dependencies) {
      for (const dep of mod.dependencies) {
        if (!loadedModules.includes(dep)) {
          console.log(`❌ ${mod.name} dependency missing: ${dep}`);
          depsOk = false;
        }
      }
    }

    const { ok, time } = await importModule(mod);
    if (ok && depsOk) {
      console.log(`✅ ${mod.name} loaded successfully (${time}ms)`);
      loadedModules.push(mod.name);
    } else {
      console.log(`❌ ${mod.name} failed (${time}ms)`);
    }

    logProgress(i + 1, totalModules);
  }

  console.log('\n🔗 Check Process complete.');
  console.log('✅ All modules attempted. Boot will continue normally.\n');
}

// -------------------------
// MAIN BOOTSTRAP
// -------------------------
async function bootstrap() {
  console.log("System booting...");

  if (RUN_CHECK_PROCESS) {
    await runCheckProcess();
  }

  // Inicjalizacja snapshotów sojuszy
  const alliances = AllianceRepo.getAll();
  for (const alliance of alliances) {
    const existing = SnapshotRepo.get(alliance.id);
    if (!existing) {
      SnapshotService.createSnapshot(alliance);
    }
  }

  const corrupted = SnapshotService.verifyAll();
  if (corrupted.length === 0) {
    Health.setHealthy();
    console.log("Initial integrity check passed.");
  } else {
    Health.setCritical(
      `Boot integrity failure detected in ${corrupted.length} alliance(s)`
    );
    SafeMode.activate("Boot integrity failure");
    console.log("Boot integrity failure. SafeMode activated.");
  }

  IntegrityMonitor.start(15000);

  const timeModule = TimeModule.getInstance();
  timeModule.start(1000);
  console.log("TimeModule started.");

  await CommandLoader.loadAllCommands();
  console.log("All commands loaded successfully.");

  await startDiscord();
  console.log("System boot completed. Discord client running.");
}

bootstrap().catch(err => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});