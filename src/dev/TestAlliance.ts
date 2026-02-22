import { AllianceService } from "../features/alliance/AllianceService";
import { AllianceRepo } from "../data/Repositories";
import { db } from "../data/Database";
import { Ownership } from "../system/Ownership";

// 🔧 Tymczasowo nadpisujemy Ownership do testów
(Ownership as any).isDiscordOwner = () => true;

async function runTest() {
  console.log("=== TEST: CREATE ALLIANCE ===");

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
    console.log("Alliance object:");
    console.log(AllianceRepo.get("ALLIANCE_1"));

    console.log("Journal entries:");
    console.log(db.journal);

  } catch (err) {
    console.error("❌ ERROR:", err);
  }
}

runTest();