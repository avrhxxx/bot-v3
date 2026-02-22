// src/index.ts

import { IntegrityMonitor } from "./system/snapshot/IntegrityMonitor";
import { Health } from "./system/Health";
import { startDiscord } from "./discord/client";
import { SnapshotService } from "./system/snapshot/SnapshotService";
import { SafeMode } from "./system/SafeMode";
import { AllianceRepo, SnapshotRepo } from "./data/Repositories";
import { CommandLoader } from "./commands/CommandLoader";
import { TimeModule } from "./system/TimeModule/TimeModule";
import path from "path";
import { performance } from "perf_hooks";

const TEST_MODE = process.env.TEST_MODE === "true";
const CHECK_PROCESS = process.env.CHECK_PROCESS === "true"; // <-- zmiana nazwy

// -------------------------
// Modules for check process
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
  { name: 'RoleModule', importPath: './system/RoleModule/RoleModule' },
  { name: 'ChannelModule', importPath: './system/ChannelModule/ChannelModule' },
  { name: 'BroadcastModule', importPath: './system/BroadcastModule/BroadcastModule' },
  { name: 'AllianceSystem', importPath: './system/alliance/AllianceSystem', dependencies: ['RoleModule','ChannelModule','BroadcastModule'] },
  { name: 'TransferLeaderSystem', importPath: './system/alliance/TransferLeaderSystem', dependencies: ['AllianceSystem','RoleModule'] },
  { name: 'IntegrityMonitor', importPath: './system/snapshot/IntegrityMonitor' },
  { name: 'RepairService', importPath: './system/snapshot/RepairService', dependencies: ['IntegrityMonitor'] },
  { name: 'SnapshotService', importPath: './system/snapshot/SnapshotService', dependencies: ['IntegrityMonitor'] },
  { name: 'SnapshotTypes', importPath: './system/snapshot/SnapshotTypes' },
  { name: 'Dispatcher', importPath: './engine/Dispatcher' },
  { name: 'MutationGate', importPath: './engine/MutationGate', dependencies: ['Dispatcher'] },
  { name: 'CommandDispatcher', importPath: './system/CommandDispatcher/CommandDispatcher', dependencies: ['OwnerModule'] },
  { name: 'AllianceIntegrity', importPath: './features/alliance/integrity/AllianceIntegrity', dependencies: ['AllianceSystem'] },
  { name: 'AllianceCreationOrchestrator', importPath: './features/alliance/orchestration/AllianceCreationOrchestrator', dependencies: ['RoleModule','ChannelModule','BroadcastModule','AllianceIntegrity'] },
  { name: 'AllianceService', importPath: './features/alliance/AllianceService', dependencies: ['AllianceSystem','AllianceIntegrity','AllianceCreationOrchestrator'] },
  { name: 'AllianceTypes', importPath: './features/alliance/AllianceTypes' },
  { name: 'DiscordClient', importPath: './discord/client', dependencies: ['AllianceService','CommandDispatcher'] },
  { name: 'Journal', importPath: './journal/Journal', dependencies: ['AllianceSystem'] },
  { name: 'JournalTypes', importPath: './journal/JournalTypes', dependencies: ['AllianceSystem'] },
  { name: 'CommandLoader', importPath: './commands/CommandLoader' },
  { name: 'CommandRegistry', importPath: './commands/CommandRegistry' },
  { name: 'Command', importPath: './commands/Command' },
  { name: 'AllianceCommands', importPath: './commands/alliance', dependencies: ['Command'] },
  { name: 'SysCommands', importPath: './commands/sys', dependencies: ['Command'] },
];

// -------------------------
// Check process utilities
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
// Main bootstrap
// -------------------------
async function bootstrap() {
  console.log("System booting...");

  // 🧪 TEST MODE
  if (TEST_MODE) {
    console.log("=== TEST MODE ENABLED ===");

    const { AllianceService } = await import("./features/alliance/AllianceService");
    const { AllianceRepo } = await import("./data/Repositories");
    const { db } = await import("./data/Repositories");
    const { Ownership } = await import("./system/Ownership");

    (Ownership as any).isDiscordOwner = () => true;

    try {
      await AllianceService.createAlliance({
        actorId: "OWNER_TEST_ID",
        guildId: "GUILD_TEST_ID",
        allianceId: "ALLIANCE_1",
        tag: "ABC",
        name: "Test Alliance",
        leaderId: "LEADER_TEST_ID",
        roles: {
          r5RoleId: "R5_ROLE",
          r4RoleId: "R4_ROLE",
          r3RoleId: "R3_ROLE",
          identityRoleId: "IDENTITY_ROLE"
        },
        channels: {
          categoryId: "CATEGORY_ID",
          leadershipChannelId: "LEAD_CHANNEL",
          officersChannelId: "OFFICER_CHANNEL",
          membersChannelId: "MEMBERS_CHANNEL",
          joinChannelId: "JOIN_CHANNEL"
        }
      });

      console.log("✅ Alliance created successfully");
      console.log("Alliance:", AllianceRepo.get("ALLIANCE_1"));
      console.log("Journal:", db.journal);

    } catch (err) {
      console.error("❌ TEST ERROR:", err);
    }

    process.exit(0);
  }

  // 🛠️ CHECK PROCESS
  if (CHECK_PROCESS) {
    await runCheckProcess();
  }

  // 🚀 NORMAL BOOT
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