// src/system/alliance/SystemInitializer.ts

import { AllianceService } from "../AllianceService";
import { MembershipModule } from "../MembershipModule";
import { RoleModule } from "../RoleModule/RoleModule";
import { ChannelModule } from "../ChannelModule/ChannelModule";
import { BroadcastModule } from "../BroadcastModule/BroadcastModule";
import { TransferLeaderSystem } from "../TransferLeaderSystem";
import { CommandDispatcher } from "../CommandDispatcher/CommandDispatcher";
import { MutationGate } from "../../engine/MutationGate";

export class SystemInitializer {
  /**
   * Inicjalizacja wszystkich modułów i komend
   */
  static async init() {
    // 1️⃣ Inicjalizacja atomowych locków
    await MutationGate.initLocks();

    // 2️⃣ Load danych z repozytoriów
    await AllianceService.loadAllAlliances();

    // 3️⃣ Synchronizacja ról i kanałów z Discord
    await RoleModule.syncAllRoles();
    await ChannelModule.syncAllChannels();

    // 4️⃣ Rejestracja komend w CommandDispatcher
    CommandDispatcher.registerCommand("join", (cmd) => MembershipModule.requestJoin(cmd.actorId, cmd.params.allianceId));
    CommandDispatcher.registerCommand("approveJoin", (cmd) => MembershipModule.approveJoin(cmd.actorId, cmd.params.allianceId, cmd.params.userId));
    CommandDispatcher.registerCommand("denyJoin", (cmd) => MembershipModule.denyJoin(cmd.actorId, cmd.params.allianceId, cmd.params.userId));
    CommandDispatcher.registerCommand("leave", (cmd) => MembershipModule.leaveAlliance(cmd.actorId, cmd.params.allianceId));
    CommandDispatcher.registerCommand("promote", (cmd) => RoleModule.promote(cmd.params.userId, cmd.params.allianceId));
    CommandDispatcher.registerCommand("demote", (cmd) => RoleModule.demote(cmd.params.userId, cmd.params.allianceId));
    CommandDispatcher.registerCommand("assignRole", (cmd) => RoleModule.assignRole(cmd.params.userId, cmd.params.allianceId, cmd.params.role));
    CommandDispatcher.registerCommand("transferLeader", (cmd) => AllianceService.transferLeadership(cmd.actorId, cmd.params.allianceId, cmd.params.newLeaderId));
    CommandDispatcher.registerCommand("createChannels", (cmd) => ChannelModule.createChannels(cmd.params.guild, cmd.params.allianceId, cmd.params.tag));
    CommandDispatcher.registerCommand("updateChannels", (cmd) => ChannelModule.updateChannelVisibility(cmd.params.allianceId));

    // 5️⃣ Walidacja spójności wszystkich sojuszy
    await AllianceService.validateAll();

    // 6️⃣ Start zadań w tle
    SystemInitializer.startBackgroundTasks();
  }

  /**
   * Uruchomienie zadań tła: rollback liderów, aktualizacje embedów, backup sojuszy
   */
  private static startBackgroundTasks() {
    // Przykład: co 10 minut sprawdzaj rollback liderów
    setInterval(async () => {
      await TransferLeaderSystem.checkOrphanLeaders();
    }, 10 * 60 * 1000);

    // Tutaj można dodać backupy sojuszy lub inne cron-taski
  }
}