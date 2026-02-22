// src/index.ts

import { IntegrityMonitor } from "./system/snapshot/IntegrityMonitor";
import { Health } from "./system/Health";
import { startDiscord } from "./discord/client";
import { SnapshotService } from "./system/snapshot/SnapshotService";
import { SafeMode } from "./system/SafeMode";
import { AllianceRepo, SnapshotRepo } from "./data/Repositories";
import { CommandLoader } from "./commands/CommandLoader";
import { TimeModule } from "./system/TimeModule/TimeModule";

async function bootstrap() {
  console.log("System booting...");

  // ✅ 1️⃣ Ensure initial snapshots exist
  const alliances = AllianceRepo.getAll();
  for (const alliance of alliances) {
    const existing = SnapshotRepo.get(alliance.id);
    if (!existing) {
      SnapshotService.createSnapshot(alliance);
    }
  }

  // ✅ 2️⃣ Verify integrity
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

  // ✅ 3️⃣ Start IntegrityMonitor
  IntegrityMonitor.start(15000);

  // ✅ 4️⃣ Start TimeModule
  const timeModule = TimeModule.getInstance();
  timeModule.start(1000); // tick co 1s
  console.log("TimeModule started.");

  // ✅ 5️⃣ Load all commands
  await CommandLoader.loadAllCommands();
  console.log("All commands loaded successfully.");

  // ✅ 6️⃣ Start Discord client
  await startDiscord();

  console.log("System boot completed. Discord client running.");
}

bootstrap().catch((err) => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});