/**
 * ============================================
 * FILE: src/system/alliance/SystemInitializer.ts
 * LAYER: SYSTEM (Alliance Initialization & Background Tasks)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Initialize all alliance system modules
 * - Sync Discord roles and channels
 * - Load system & user commands
 * - Validate alliance consistency
 * - Start background tasks (leader rollback, backups)
 *
 * DEPENDENCIES:
 * - AllianceService (load, validate)
 * - MembershipModule, RoleModule, ChannelModule, BroadcastModule
 * - TransferLeaderSystem (orphan rollback)
 * - MutationGate (locks & atomic operations)
 * - CommandLoader (dynamic command loading)
 *
 * NOTE:
 * - All data mutations require MutationGate
 * - startBackgroundTasks runs intervals that must handle errors safely
 *
 * ============================================
 */

import { AllianceService } from "../AllianceService";
import { MembershipModule } from "./modules/membership/MembershipModule";
import { RoleModule } from "./modules/role/RoleModule";
import { ChannelModule } from "./modules/channel/ChannelModule";
import { BroadcastModule } from "./modules/broadcast/BroadcastModule";
import { TransferLeaderSystem } from "../TransferLeaderSystem";
import { MutationGate } from "../../engine/MutationGate";
import { CommandLoader } from "../../commands/loader/CommandLoader";

export class SystemInitializer {
  /**
   * Initialize all modules and system commands
   */
  static async init() {
    // 1️⃣ Initialize atomic locks via MutationGate
    await MutationGate.initLocks();

    // 2️⃣ Load all alliances from repository
    if (AllianceService.loadAllAlliances) {
      await AllianceService.loadAllAlliances();
    }

    // 3️⃣ Sync all roles and channels with Discord
    if (RoleModule.syncAllRoles) await RoleModule.syncAllRoles();
    if (ChannelModule.syncAllChannels) await ChannelModule.syncAllChannels();

    // 4️⃣ Load all commands (system + user)
    if (CommandLoader.loadAllCommands) await CommandLoader.loadAllCommands();

    // 5️⃣ Validate all alliances consistency
    if (AllianceService.validateAll) await AllianceService.validateAll();

    // 6️⃣ Start background tasks (leader rollback, backups)
    SystemInitializer.startBackgroundTasks();
  }

  /**
   * Start background tasks:
   * - Rollback orphan leaders
   * - Alliance updates / backups (placeholders for future tasks)
   */
  private static startBackgroundTasks() {
    // Every 10 minutes, check orphan leaders
    setInterval(async () => {
      try {
        await TransferLeaderSystem.checkOrphanLeaders();
      } catch (err) {
        console.error("❌ Error during orphan leader check:", err);
      }
    }, 10 * 60 * 1000);

    // Placeholder for alliance backups
    // setInterval(() => SnapshotService.backupAlliances(), 60 * 60 * 1000);
  }
}