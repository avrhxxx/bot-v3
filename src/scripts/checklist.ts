// src/scripts/checklist.ts
import path from 'path';
import { performance } from 'perf_hooks';

type ModuleDef = {
  name: string;
  importPath: string;
  dependencies?: string[];
};

const modules: ModuleDef[] = [
  // ---------------- Core System ----------------
  { name: 'Health', importPath: '../system/Health' },
  { name: 'Ownership', importPath: '../system/Ownership' },
  { name: 'SafeMode', importPath: '../system/SafeMode' },
  { name: 'TimeModule', importPath: '../system/TimeModule/TimeModule' },
  { name: 'OwnerModule', importPath: '../system/OwnerModule/OwnerModule' },

  // ---------------- Data ----------------
  { name: 'Database', importPath: '../data/Database' },
  { name: 'Repositories', importPath: '../data/Repositories' },

  // ---------------- Locks ----------------
  { name: 'AllianceLock', importPath: '../locks/AllianceLock' },
  { name: 'GlobalLock', importPath: '../locks/GlobalLock' },

  // ---------------- Alliance System ----------------
  { name: 'RoleModule', importPath: '../system/RoleModule/RoleModule' },
  { name: 'ChannelModule', importPath: '../system/ChannelModule/ChannelModule' },
  { name: 'BroadcastModule', importPath: '../system/BroadcastModule/BroadcastModule' },
  { name: 'AllianceSystem', importPath: '../system/alliance/AllianceSystem', dependencies: ['RoleModule','ChannelModule','BroadcastModule'] },
  { name: 'TransferLeaderSystem', importPath: '../system/alliance/TransferLeaderSystem', dependencies: ['AllianceSystem','RoleModule'] },

  // ---------------- Snapshot ----------------
  { name: 'IntegrityMonitor', importPath: '../snapshot/IntegrityMonitor' },
  { name: 'RepairService', importPath: '../snapshot/RepairService', dependencies: ['IntegrityMonitor'] },
  { name: 'SnapshotService', importPath: '../snapshot/SnapshotService', dependencies: ['IntegrityMonitor'] },
  { name: 'SnapshotTypes', importPath: '../snapshot/SnapshotTypes' },

  // ---------------- Engine ----------------
  { name: 'Dispatcher', importPath: '../engine/Dispatcher' },
  { name: 'MutationGate', importPath: '../engine/MutationGate', dependencies: ['Dispatcher'] },
  { name: 'CommandDispatcher', importPath: '../system/CommandDispatcher/CommandDispatcher', dependencies: ['OwnerModule'] },

  // ---------------- Features ----------------
  { name: 'AllianceIntegrity', importPath: '../features/alliance/integrity/AllianceIntegrity', dependencies: ['AllianceSystem'] },
  { name: 'AllianceCreationOrchestrator', importPath: '../features/alliance/orchestration/AllianceCreationOrchestrator', dependencies: ['RoleModule','ChannelModule','BroadcastModule','AllianceIntegrity'] },
  { name: 'AllianceService', importPath: '../features/alliance/AllianceService', dependencies: ['AllianceSystem','AllianceIntegrity','AllianceCreationOrchestrator'] },
  { name: 'AllianceTypes', importPath: '../features/alliance/AllianceTypes' },

  // ---------------- Discord ----------------
  { name: 'DiscordClient', importPath: '../discord/client', dependencies: ['AllianceService','CommandDispatcher'] },

  // ---------------- Journal ----------------
  { name: 'Journal', importPath: '../journal/Journal', dependencies: ['AllianceSystem'] },
  { name: 'JournalTypes', importPath: '../journal/JournalTypes', dependencies: ['AllianceSystem'] },

  // ---------------- Commands ----------------
  { name: 'CommandLoader', importPath: '../commands/CommandLoader' },
  { name: 'CommandRegistry', importPath: '../commands/CommandRegistry' },
  { name: 'Command', importPath: '../commands/Command' },
  { name: 'AllianceCommands', importPath: '../commands/alliance', dependencies: ['Command'] },
  { name: 'SysCommands', importPath: '../commands/sys', dependencies: ['Command'] },
];

// ---------------- Utility functions ----------------
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

// ---------------- Main checklist runner ----------------
async function runChecklist() {
  console.log('\n🛠️  Ultra-Premium Pre-Deploy Checklist Starting...\n');

  const totalModules = modules.length;
  let loadedModules: string[] = [];

  for (let i = 0; i < totalModules; i++) {
    const mod = modules[i];

    // Dependency check
    let depsOk = true;
    if (mod.dependencies) {
      for (const dep of mod.dependencies) {
        if (!loadedModules.includes(dep)) {
          console.log(`❌ ${mod.name} dependency missing: ${dep}`);
          depsOk = false;
        }
      }
    }

    // Import module
    const { ok, time } = await importModule(mod);
    if (ok && depsOk) {
      console.log(`✅ ${mod.name} loaded successfully (${time}ms)`);
      loadedModules.push(mod.name);
    } else {
      console.log(`❌ ${mod.name} failed (${time}ms)`);
    }

    logProgress(i + 1, totalModules);
  }

  console.log('\n\n🔗 Ultra-Premium Dependency check complete.');
  console.log('✅ All modules attempted. No changes made to bot or Discord.');
}

runChecklist().catch(err => {
  console.error('❌ Error during checklist execution:', err);
});