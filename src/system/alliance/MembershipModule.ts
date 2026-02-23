// src/system/alliance/MembershipModule.ts

import { AllianceService } from "./AllianceService";
import { RoleModule, AllianceRoles } from "./RoleModule";
import { BroadcastModule } from "./BroadcastModule";
import { TransferLeaderSystem } from "./TransferLeaderSystem";
import { AllianceIntegrity } from "./integrity/AllianceIntegrity";
import { MutationGate } from "../../engine/MutationGate";

export class MembershipModule {
  // ----------------- JOIN -----------------
  static async requestJoin(actorId: string, allianceId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      // Walidacja: czy użytkownik już nie należy do innego sojuszu
      if (AllianceService.isMember(alliance, actorId)) {
        throw new Error("Użytkownik już należy do sojuszu");
      }

      // Dodanie zgłoszenia oczekującego
      alliance.pendingJoins = alliance.pendingJoins || [];
      alliance.pendingJoins.push({ userId: actorId, requestedAt: Date.now() });

      AllianceService.logAudit(allianceId, {
        action: "requestJoin",
        userId: actorId,
      });
    });
  }

  static async approveJoin(actorId: string, allianceId: string, userId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      // Sprawdzenie uprawnień aktora (R5/R4)
      if (!AllianceService.isMember(alliance, actorId)) {
        throw new Error("Brak uprawnień do akceptacji zgłoszenia");
      }

      const roles: AllianceRoles = alliance.roles;

      // Dodanie członka do R3
      await RoleModule.assignRole(await alliance.guild.members.fetch(userId), roles.r3RoleId);

      // Aktualizacja listy członków
      alliance.members.push({ userId, role: "R3" });

      // Usunięcie zgłoszenia oczekującego
      alliance.pendingJoins = alliance.pendingJoins.filter(j => j.userId !== userId);

      // Walidacja spójności
      AllianceIntegrity.validate(alliance);

      // Powiadomienie
      await BroadcastModule.announceJoin(allianceId, userId);

      // Log
      AllianceService.logAudit(allianceId, {
        action: "approveJoin",
        actorId,
        userId,
      });
    });
  }

  static async denyJoin(actorId: string, allianceId: string, userId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      // Usunięcie zgłoszenia oczekującego
      alliance.pendingJoins = alliance.pendingJoins.filter(j => j.userId !== userId);

      // Powiadomienie
      await BroadcastModule.sendCustomMessage(allianceId, `Zgłoszenie użytkownika <@${userId}> zostało odrzucone.`);

      // Log
      AllianceService.logAudit(allianceId, {
        action: "denyJoin",
        actorId,
        userId,
      });
    });
  }

  // ----------------- LEAVE -----------------
  static async leaveAlliance(actorId: string, allianceId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance = AllianceService.getAllianceOrThrow(allianceId);

      // Usunięcie członka z listy
      alliance.members = alliance.members.filter(m => m.userId !== actorId);

      // Rollback leadership jeśli opuszcza lider
      const leader = alliance.members.find(m => m.role === "R5");
      if (!leader) {
        await TransferLeaderSystem.rollbackLeadership(allianceId);
      }

      // Walidacja spójności
      AllianceIntegrity.validate(alliance);

      // Powiadomienie
      await BroadcastModule.announceLeave(allianceId, actorId);

      // Log
      AllianceService.logAudit(allianceId, {
        action: "leaveAlliance",
        userId: actorId,
      });
    });
  }

  // ----------------- LEADERSHIP -----------------
  static async rollbackLeadership(actorId: string, allianceId: string) {
    await MutationGate.runAtomically(async () => {
      await TransferLeaderSystem.rollbackLeadership(allianceId);

      // Log
      AllianceService.logAudit(allianceId, {
        action: "rollbackLeadership",
        actorId,
      });
    });
  }

  // ----------------- HELPERS / INTEGRITY -----------------
  private static checkOrphanState(allianceId: string) {
    const alliance = AllianceService.getAllianceOrThrow(allianceId);
    const leader = alliance.members.find(m => m.role === "R5");
    return !leader;
  }
}