/**
 * ============================================
 * FILE: src/system/alliance/TransferLeaderSystem.ts
 * LAYER: SYSTEM (Leadership Domain Logic)
 * ============================================
 *
 * RESPONSIBILITIES:
 * - Manual leadership transfer within the alliance (R4 → R5)
 * - Admin/owner can set leader (any Discord user if no leader, or R4 if leader exists)
 * - Broadcasts and audit logging for leadership changes
 *
 * DEPENDENCIES:
 * - AllianceService (fetch/update alliance, audit logs)
 * - RoleModule (assign roles in Discord)
 * - BroadcastModule (announce leadership changes)
 * - MutationGate (atomic operations)
 *
 * NOTES:
 * - Transfers respect role limits (R4 → R5 only)
 * - setLeader can override limits for setup or emergency
 *
 * WORKFLOW PRZYWŁASZCZENIA LIDERA:
 * 1️⃣ transferLeadership → zwykła zmiana lidera R4 → R5 przez obecnego lidera
 * 2️⃣ setLeader → ustawienie lidera przez Ownera/Admina (awaryjne lub inicjalizacja)
 *
 * ============================================
 */

// ----------------- IMPORTY -----------------
import { AllianceService } from "./AllianceService"; // pełna ścieżka
import { RoleModule } from "./modules/role/RoleModule"; // role i przypisania
import { BroadcastModule } from "./modules/broadcast/BroadcastModule"; // broadcasty
import { MutationGate } from "../../engine/MutationGate"; // atomowość
import { Alliance } from "./AllianceTypes"; // typy sojuszu

// ----------------- KLASA -----------------
export class TransferLeaderSystem {

  // ----------------- MANUAL TRANSFER (R4 → R5 ONLY) -----------------
  // Użycie: normalny workflow przez lidera (R5) w sojuszu
  // Przekazuje leadership do R4 członka
  // Nie wolno używać jeśli jesteś nie-liderem
  static async transferLeadership(actorId: string, allianceId: string, newLeaderId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance: Alliance = AllianceService.getAllianceOrThrow(allianceId);

      // walidacja: tylko aktualny lider może przekazać leadership
      if (alliance.members.r5 !== actorId) {
        throw new Error("Only the current leader can transfer leadership.");
      }

      const r4List = alliance.members.r4 || [];
      if (!r4List.includes(newLeaderId)) {
        throw new Error("Leadership can only be transferred to an R4 member.");
      }

      const oldLeaderId = alliance.members.r5;
      if (!oldLeaderId) throw new Error("Alliance has no current leader.");

      const newLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, newLeaderId);
      const oldLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, oldLeaderId);

      await RoleModule.assignLeaderRoles(newLeaderMember, alliance.roles);
      await RoleModule.assignR4Roles(oldLeaderMember, alliance.roles);

      // aktualizacja ról w członkostwie
      alliance.members.r4 = r4List.filter(id => id !== newLeaderId);
      alliance.members.r4.push(oldLeaderId);
      alliance.members.r5 = newLeaderId;

      await AllianceService.updateAlliance(alliance);

      // broadcast i log audytu
      await BroadcastModule.announceLeadershipChange(allianceId, actorId, newLeaderId);
      AllianceService.logAudit(allianceId, {
        action: "transferLeadership",
        actorId,
        previousLeaderId: oldLeaderId,
        newLeaderId
      });
    });
  }

  // ----------------- ADMIN / OWNER SET LEADER -----------------
  // Użycie: tylko Bot Owner / Discord Owner / Admin
  // Może ustawić lidera w sytuacjach awaryjnych lub inicjalizacji
  // - Jeśli brak lidera, przypisuje nowego bez walidacji R4
  // - Jeśli lider istnieje, nowy lider musi być R4
  static async setLeader(actorId: string, allianceId: string, newLeaderId: string) {
    await MutationGate.runAtomically(async () => {
      const alliance: Alliance = AllianceService.getAllianceOrThrow(allianceId);
      const oldLeaderId = alliance.members.r5;

      const newLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, newLeaderId);
      if (!newLeaderMember) throw new Error("Unable to fetch GuildMember for the new leader.");

      // brak obecnego lidera
      if (!oldLeaderId) {
        await RoleModule.assignLeaderRoles(newLeaderMember, alliance.roles);
        alliance.members.r5 = newLeaderId;
        await AllianceService.updateAlliance(alliance);

        await BroadcastModule.announceLeadershipChange(allianceId, actorId, newLeaderId);
        AllianceService.logAudit(allianceId, { action: "setLeader", actorId, newLeaderId });
        return;
      }

      // walidacja: nowy lider musi być R4
      const r4List = alliance.members.r4 || [];
      if (!r4List.includes(newLeaderId)) {
        throw new Error("New leader must be an R4 member.");
      }

      const oldLeaderMember = await AllianceService.fetchGuildMember(alliance.guildId, oldLeaderId);

      await RoleModule.assignLeaderRoles(newLeaderMember, alliance.roles);
      await RoleModule.assignR4Roles(oldLeaderMember, alliance.roles);

      // aktualizacja członkostwa
      alliance.members.r4 = r4List.filter(id => id !== newLeaderId);
      alliance.members.r4.push(oldLeaderId);
      alliance.members.r5 = newLeaderId;

      await AllianceService.updateAlliance(alliance);

      await BroadcastModule.announceLeadershipChange(allianceId, actorId, newLeaderId);
      AllianceService.logAudit(allianceId, {
        action: "setLeader",
        actorId,
        previousLeaderId: oldLeaderId,
        newLeaderId
      });
    });
  }

  // ----------------- LEADER VALIDATION -----------------
  static validateLeadership(alliance: Alliance) {
    const leaderId = alliance.members.r5;
    if (!leaderId) throw new Error("Alliance must have exactly one leader.");

    const allMembers = [
      ...(alliance.members.r3 || []),
      ...(alliance.members.r4 || []),
      ...(alliance.members.r5 ? [alliance.members.r5] : [])
    ];

    if (!allMembers.includes(leaderId)) {
      throw new Error("Invalid leader state: leader is not listed as a member.");
    }
  }

  // ----------------- BACKGROUND / ORPHAN CHECK (stub) -----------------
  static async checkOrphanLeaders() {
    // stub do builda / background task
    return;
  }

}