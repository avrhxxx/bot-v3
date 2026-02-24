/**
 * ============================================
 * FILE: src/system/alliance/TransferLeaderSystem.ts
 * LAYER: SYSTEM (Leadership Domain Logic)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Manualny transfer lidera (R5 → R5)
 * - Automatyczny fallback (R4 → R3 → delete)
 * - Walidacja spójności lidera
 *
 * ZALEŻNOŚCI:
 * - AllianceService (pobranie sojuszu + audit)
 * - RoleModule (aktualizacja ról Discord)
 * - BroadcastModule (ogłoszenia)
 * - AllianceIntegrity (walidacja)
 *
 * UWAGA:
 * - Używa MutationGate (atomiczne operacje)
 * - getAllianceOrThrow musi być PUBLIC w AllianceService
 *
 * ============================================
 */

import { AllianceService } from "./AllianceService";
import { RoleModule } from "./modules/role/RoleModule";
import { BroadcastModule } from "./modules/broadcast/BroadcastModule";
import { MutationGate } from "../../engine/MutationGate";
import { AllianceIntegrity } from "./integrity/AllianceIntegrity";
import { Alliance, AllianceMembers } from "./AllianceTypes";

export class TransferLeaderSystem {
  static fallbackDelay = 3000;

  // ----------------- MANUAL TRANSFER -----------------
  static async transferLeadership(actorId: string, allianceId: string, newLeaderId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      const currentLeader = alliance.members.find(m => m.role === "R5");
      if (!currentLeader || currentLeader.userId !== actorId) {
        throw new Error("Brak uprawnień do transferu lidera");
      }

      // Zmiana roli obecnego lidera
      currentLeader.role = "R4";
      await RoleModule.assignRole(
        await alliance.guild.members.fetch(actorId),
        alliance.roles.r4RoleId
      );

      // Przypisanie nowego lidera
      const newLeader = alliance.members.find(m => m.userId === newLeaderId);
      if (!newLeader) throw new Error("Nowy lider nie należy do sojuszu");

      newLeader.role = "R5";
      await RoleModule.assignRole(
        await alliance.guild.members.fetch(newLeaderId),
        alliance.roles.r5RoleId
      );

      AllianceIntegrity.validate(alliance);

      await BroadcastModule.announceLeadershipChange(allianceId, actorId, newLeaderId);

      AllianceService.logAudit(allianceId, {
        action: "transferLeadership",
        oldLeaderId: actorId,
        newLeaderId,
      });
    });
  }

  // ----------------- AUTOMATIC FALLBACK -----------------
  static async rollbackLeadership(allianceId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      await new Promise(res => setTimeout(res, TransferLeaderSystem.fallbackDelay));

      // Najpierw kandydaci R4
      const candidateR4 = alliance.members
        .filter(m => m.role === "R4")
        .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))[0];

      if (candidateR4) {
        await this.transferLeadershipSystem(allianceId, candidateR4.userId);
        return;
      }

      // Następnie kandydaci R3
      const candidateR3 = alliance.members
        .filter(m => m.role === "R3")
        .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))[0];

      if (candidateR3) {
        await this.transferLeadershipSystem(allianceId, candidateR3.userId);
        return;
      }

      // Brak kandydatów → usunięcie sojuszu
      await AllianceService.confirmDelete("SYSTEM", allianceId);
    });
  }

  // ----------------- INTERNAL TRANSFER -----------------
  private static async transferLeadershipSystem(allianceId: string, newLeaderId: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);

    const oldLeader = alliance.members.find(m => m.role === "R5");
    if (oldLeader) {
      oldLeader.role = "R4";
      await RoleModule.assignRole(
        await alliance.guild.members.fetch(oldLeader.userId),
        alliance.roles.r4RoleId
      );
    }

    const newLeader = alliance.members.find(m => m.userId === newLeaderId);
    if (!newLeader) return;

    newLeader.role = "R5";
    await RoleModule.assignRole(
      await alliance.guild.members.fetch(newLeaderId),
      alliance.roles.r5RoleId
    );

    AllianceIntegrity.validate(alliance);

    await BroadcastModule.announceLeadershipChange(
      allianceId,
      oldLeader?.userId ?? "SYSTEM",
      newLeaderId
    );

    AllianceService.logAudit(allianceId, {
      action: "AUTO_TRANSFER_LEADER",
      oldLeaderId: oldLeader?.userId ?? "SYSTEM",
      newLeaderId,
    });
  }

  // ----------------- VALIDATION -----------------
  static validateLeadership(alliance: Alliance) {
    AllianceIntegrity.validate(alliance);
  }
}