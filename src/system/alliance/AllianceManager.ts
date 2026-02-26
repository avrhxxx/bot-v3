/**
 * ============================================
 * FILE: src/system/alliance/AllianceManager.ts
 * LAYER: SYSTEM (Core Domain Service)
 * ============================================
 *
 * ZAWARTOŚĆ:
 * - Główny manager logiki sojuszu
 * - Operacje CRUD, zarządzanie członkami, liderami
 * - Integracja z modułami: RoleModule, BroadcastModule, TransferLeaderSystem
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Koordynuje wszystkie akcje sojuszu
 * - Wywołuje funkcje pomocnicze z AllianceHelpers
 * - Loguje audyt przy każdej zmianie
 *
 * ============================================
 */

import { Alliance, AllianceRoles, AllianceChannels } from "./AllianceTypes";
import { AllianceHelpers as Helpers } from "./AllianceHelpers";
import { RoleModule } from "./modules/role/RoleModule";
import { BroadcastModule } from "./modules/broadcast/BroadcastModule";
import { TransferLeaderSystem } from "./TransferLeaderSystem";
import { AllianceRepo, PendingDeletionRepo } from "../../data/Repositories";

const MAX_MEMBERS = 100;
const MAX_R4 = 10;

export class AllianceManager {

  // ----------------- MEMBERS -----------------
  static async addMember(actorId: string, allianceId: string, userId: string): Promise<void> {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (Helpers.isMember(alliance, userId)) throw new Error("User is already a member");
    if (Helpers.getTotalMembers(alliance) >= MAX_MEMBERS) throw new Error("Alliance is full");

    alliance.members.r3 = alliance.members.r3 || [];
    alliance.members.r3.push(userId);
    Helpers.checkOrphanState(alliance);
    AllianceRepo.set(allianceId, alliance);

    Helpers.logAudit(allianceId, { action: "addMember", actorId, userId });
  }

  static async promoteToR4(actorId: string, allianceId: string, userId: string): Promise<void> {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (!alliance.members.r3?.includes(userId)) throw new Error("User is not R3");
    alliance.members.r4 = alliance.members.r4 || [];
    if (alliance.members.r4.length >= MAX_R4) throw new Error("Max R4 reached");

    alliance.members.r3 = alliance.members.r3.filter(u => u !== userId);
    alliance.members.r4.push(userId);
    AllianceRepo.set(allianceId, alliance);

    Helpers.logAudit(allianceId, { action: "promoteToR4", actorId, userId });
  }

  static async removeMember(actorId: string, allianceId: string, userId: string): Promise<void> {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (alliance.members.r5 === userId) alliance.members.r5 = null;
    alliance.members.r4 = alliance.members.r4?.filter(u => u !== userId) || [];
    alliance.members.r3 = alliance.members.r3?.filter(u => u !== userId) || [];

    Helpers.checkOrphanState(alliance);
    AllianceRepo.set(allianceId, alliance);

    Helpers.logAudit(allianceId, { action: "removeMember", actorId, userId });
  }

  // ----------------- LEADERSHIP -----------------
  static async transferLeadership(actorId: string, allianceId: string, newLeaderId: string): Promise<void> {
    await TransferLeaderSystem.transferLeadership(actorId, allianceId, newLeaderId);
  }

  // ----------------- UPDATE -----------------
  static async updateTag(actorId: string, allianceId: string, newTag: string): Promise<void> {
    const alliance = this.getAllianceOrThrow(allianceId);
    const oldTag = alliance.tag;

    alliance.tag = newTag;
    AllianceRepo.set(allianceId, alliance);

    await RoleModule.updateTag(allianceId, newTag);
    await BroadcastModule.updateTag(allianceId, newTag);

    Helpers.logAudit(allianceId, { action: "updateTag", actorId, oldTag, newTag });
  }

  static async updateName(actorId: string, allianceId: string, newName: string): Promise<void> {
    const alliance = this.getAllianceOrThrow(allianceId);
    const oldName = alliance.name;

    alliance.name = newName;
    AllianceRepo.set(allianceId, alliance);

    await BroadcastModule.updateName(allianceId, newName);

    Helpers.logAudit(allianceId, { action: "updateName", actorId, oldName, newName });
  }

  // ----------------- DELETION -----------------
  static requestDelete(actorId: string, allianceId: string): void {
    const alliance = this.getAllianceOrThrow(allianceId);
    PendingDeletionRepo.set(allianceId, alliance);

    Helpers.logAudit(allianceId, { action: "requestDelete", actorId });
  }

  static async confirmDelete(actorId: string, allianceId: string): Promise<void> {
    const alliance = PendingDeletionRepo.get(allianceId);
    if (!alliance) throw new Error("No pending deletion for this alliance");

    PendingDeletionRepo.delete(allianceId);
    AllianceRepo.delete(allianceId);

    await BroadcastModule.removeAlliance(allianceId);
    await RoleModule.removeRoles(alliance.roles);

    Helpers.logAudit(allianceId, { action: "confirmDelete", actorId });
  }

  // ----------------- HELPERS -----------------
  public static getAllianceOrThrow(id: string): Alliance {
    const alliance = AllianceRepo.get(id);
    if (!alliance) throw new Error(`Alliance ${id} not found`);
    return alliance;
  }

}