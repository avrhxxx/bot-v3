// src/index.ts

import { IntegrityMonitor } from "./system/snapshot/IntegrityMonitor";
import { Health } from "./system/Health";
import { startDiscord } from "./discord/client";
import { SnapshotService } from "./system/snapshot/SnapshotService";
import { SafeMode } from "./system/SafeMode";
import { AllianceRepo, SnapshotRepo } from "./data/Repositories";
import { CommandLoader } from "./commands/CommandLoader";
import { TimeModule } from "./system/TimeModule/TimeModule";

const TEST_MODE = process.env.TEST_MODE === "true";

async function bootstrap() {
  console.log("System booting...");

  // =========================
  // 🧪 TEST MODE
  // =========================
  if (TEST_MODE) {
    console.log("=== TEST MODE ENABLED ===");

    const { AllianceService } = await import("./features/alliance/AllianceService");
    const { AllianceRepo } = await import("./data/Repositories");
    const { db } = await import("./data/Repositories");
    const { Ownership } = await import("./system/Ownership");

    // Nadpisujemy owner check tylko do testu
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

  // =========================
  // 🚀 NORMAL BOOT
  // =========================

  // 1️⃣ Ensure initial snapshots exist
  const alliances = AllianceRepo.getAll();
  for (const alliance of alliances) {
    const existing = SnapshotRepo.get(alliance.id);
    if (!existing) {
      SnapshotService.createSnapshot(alliance);
    }
  }

  // 2️⃣ Verify integrity
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

  // 3️⃣ Start IntegrityMonitor
  IntegrityMonitor.start(15000);

  // 4️⃣ Start TimeModule
  const timeModule = TimeModule.getInstance();
  timeModule.start(1000);
  console.log("TimeModule started.");

  // 5️⃣ Load all commands
  await CommandLoader.loadAllCommands();
  console.log("All commands loaded successfully.");

  // 6️⃣ Start Discord client
  await startDiscord();

  console.log("System boot completed. Discord client running.");
}

bootstrap().catch((err) => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});