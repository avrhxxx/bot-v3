// src/scripts/checklist.ts
import fs from "fs";
import path from "path";

// Funkcja do logowania statusu modułu
function checkModule(name: string, checkFn: () => boolean) {
  try {
    const result = checkFn();
    if (result) {
      console.log(`[✅ OK] ${name}`);
    } else {
      console.warn(`[⚠️ FAILED] ${name}`);
    }
    return result;
  } catch (err) {
    console.error(`[❌ ERROR] ${name}:`, err);
    return false;
  }
}

// Lista modułów w kolejności z blueprinta
const modules = [
  { name: "Health", path: "../system/Health" },
  { name: "Ownership", path: "../system/Ownership" },
  { name: "OwnerModule", path: "../system/OwnerModule/OwnerModule" },
  { name: "SafeMode", path: "../system/SafeMode" },
  { name: "TimeModule", path: "../system/TimeModule/TimeModule" },
  { name: "Database", path: "../data/Database" },
  { name: "Repositories", path: "../data/Repositories" },
  { name: "AllianceLock", path: "../locks/AllianceLock" },
  { name: "GlobalLock", path: "../locks/GlobalLock" },
  { name: "RoleModule", path: "../system/RoleModule/RoleModule" },
  { name: "ChannelModule", path: "../system/ChannelModule/ChannelModule" },
  { name: "BroadcastModule", path: "../system/BroadcastModule/BroadcastModule" },
  { name: "CommandDispatcher", path: "../system/CommandDispatcher/CommandDispatcher" },
  { name: "AllianceSystem", path: "../system/alliance/AllianceSystem" },
  { name: "TransferLeaderSystem", path: "../system/alliance/TransferLeaderSystem" },
  { name: "IntegrityMonitor", path: "../snapshot/IntegrityMonitor" },
  { name: "RepairService", path: "../snapshot/RepairService" },
  { name: "SnapshotService", path: "../snapshot/SnapshotService" },
  { name: "Dispatcher", path: "../engine/Dispatcher" },
  { name: "MutationGate", path: "../engine/MutationGate" },
  { name: "AllianceService", path: "../features/alliance/AllianceService" },
  { name: "AllianceIntegrity", path: "../features/alliance/integrity/AllianceIntegrity" },
  { name: "AllianceCreationOrchestrator", path: "../features/alliance/orchestration/AllianceCreationOrchestrator" },
  { name: "Journal", path: "../journal/Journal" },
  { name: "JournalTypes", path: "../journal/JournalTypes" },
  { name: "Discord Client", path: "../discord/client" }
];

// Przechodzi przez wszystkie moduły
let allPassed = true;
modules.forEach((mod) => {
  const passed = checkModule(mod.name, () => {
    // Sprawdzenie, czy plik istnieje
    const filePath = path.resolve(__dirname, mod.path + ".ts");
    return fs.existsSync(filePath);
  });
  if (!passed) allPassed = false;
});

if (allPassed) {
  console.log("\n✅ Wszystkie moduły obecne. Gotowe do startu bota!");
} else {
  console.warn("\n⚠️ Nie wszystkie moduły są OK. Sprawdź powyższe błędy przed deployem.");
  process.exit(1); // przerywa start bota w Railway, jeśli coś nie działa
}