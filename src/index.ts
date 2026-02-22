import { IntegrityMonitor } from "./system/snapshot/IntegrityMonitor";
import { Health } from "./system/Health";
import { startDiscord } from "./discord/client";
import { SnapshotService } from "./system/snapshot/SnapshotService";
import { SafeMode } from "./system/SafeMode";
import { AllianceRepo, SnapshotRepo } from "./data/Repositories";
import { CommandLoader } from "./commands/CommandLoader"; // ✅ loader komend
import { TimeModule } from "./system/TimeModule/TimeModule"; // ✅ TimeModule import

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
  console.log("Integrity Monitor started.");

  // ✅ 4️⃣ Load all commands before Discord
  await CommandLoader.loadAllCommands();
  console.log("All commands loaded successfully.");

  // ✅ 5️⃣ Start TimeModule
  TimeModule.getInstance().start(1000); // tick co 1 sekundę
  console.log("⏱ TimeModule started with 1s tick rate");

  // ✅ 6️⃣ Start Discord client
  await startDiscord();
}

bootstrap().catch((err) => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});