// src/system/alliance/TransferLeaderSystem.ts

import { AllianceService } from "./AllianceService";
import { RoleModule } from "./RoleModule";
import { BroadcastModule } from "./BroadcastModule";
import { MutationGate } from "../../engine/MutationGate";
import { AllianceIntegrity } from "./integrity/AllianceIntegrity";

export class TransferLeaderSystem {
  static fallbackDelay = 3000;

  // ----------------- MANUAL TRANSFER -----------------
  static async transferLeadership(actorId: string, allianceId: string, newLeaderId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      // Sprawdzenie uprawnień: tylko R5 lub bot owner
      const currentLeader = alliance.members.find(m => m.role === "R5");
      if (!currentLeader || currentLeader.userId !== actorId) {
        throw new Error("Brak uprawnień do transferu lidera");
      }

      // Degradacja obecnego lidera do R4
      currentLeader.role = "R4";
      await RoleModule.assignRole(await alliance.guild.members.fetch(actorId), alliance.roles.r4RoleId);

      // Promocja nowego lidera do R5
      const newLeader = alliance.members.find(m => m.userId === newLeaderId);
      if (!newLeader) throw new Error("Nowy lider nie należy do sojuszu");
      newLeader.role = "R5";
      await RoleModule.assignRole(await alliance.guild.members.fetch(newLeaderId), alliance.roles.r5RoleId);

      // Walidacja spójności
      AllianceIntegrity.validate(alliance);

      // Powiadomienie
      await BroadcastModule.announceLeadershipChange(allianceId, actorId, newLeaderId);

      // Log
      AllianceService.logAudit(allianceId, {
        action: "transferLeadership",
        oldLeaderId: actorId,
        newLeaderId,
      });
    });
  }

  // ----------------- ROLLBACK / AUTOMATIC -----------------
  static async rollbackLeadership(allianceId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      // Poczekaj fallbackDelay zanim automatycznie przeniesiesz lidera
      await new Promise(res => setTimeout(res, TransferLeaderSystem.fallbackDelay));

      const candidateR4 = alliance.members
        .filter(m => m.role === "R4")
        .sort((a, b) => a.joinedAt - b.joinedAt)[0];

      if (candidateR4) {
        await this.transferLeadershipSystem(allianceId, candidateR4.userId);
        return;
      }

      const candidateR3 = alliance.members
        .filter(m => m.role === "R3")
        .sort((a, b) => a.joinedAt - b.joinedAt)[0];

      if (candidateR3) {
        await this.transferLeadershipSystem(allianceId, candidateR3.userId);
        return;
      }

      // Brak kandydatów – usunięcie sojuszu
      await AllianceService.confirmDelete("SYSTEM", allianceId);
    });
  }

  // ----------------- HELPERS -----------------
  private static async transferLeadershipSystem(allianceId: string, newLeaderId: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);

    // Obecny lider
    const oldLeader = alliance.members.find(m => m.role === "R5");
    if (oldLeader) {
      oldLeader.role = "R4";
      await RoleModule.assignRole(await alliance.guild.members.fetch(oldLeader.userId), alliance.roles.r4RoleId);
    }

    // Nowy lider
    const newLeader = alliance.members.find(m => m.userId === newLeaderId);
    if (!newLeader) return;
    newLeader.role = "R5";
    await RoleModule.assignRole(await alliance.guild.members.fetch(newLeaderId), alliance.roles.r5RoleId);

    // Walidacja spójności
    AllianceIntegrity.validate(alliance);

    // Powiadomienie
    await BroadcastModule.announceLeadershipChange(allianceId, oldLeader?.userId ?? "SYSTEM", newLeaderId);

    // Log
    AllianceService.logAudit(allianceId, {
      action: "AUTO_TRANSFER_LEADER",
      oldLeaderId: oldLeader?.userId ?? "SYSTEM",
      newLeaderId,
    });
  }

  static validateLeadership(alliance: any) {
    AllianceIntegrity.validate(alliance);
  }
}