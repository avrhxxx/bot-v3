import { IntegrityMonitor } from "./system/snapshot/IntegrityMonitor";
import { Health } from "./system/Health";
import { startDiscord } from "./discord/client";
import { SnapshotService } from "./system/snapshot/SnapshotService";
import { SafeMode } from "./system/SafeMode";
import { AllianceRepo, SnapshotRepo } from "./data/Repositories";

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

  // ✅ 2️⃣ Now verify
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

  await startDiscord();

  console.log("Integrity Monitor started.");
}

bootstrap().catch((err) => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});