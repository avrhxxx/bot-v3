/**
 * ============================================
 * FILE: src/system/alliance/AllianceService.ts
 * LAYER: SYSTEM (Core Domain Service)
 * ============================================
 *
 * CENTRALNY SERWIS LOGIKI SOJUSZU
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Zarządzanie encją Alliance
 * - Operacje domenowe (create, update, delete)
 * - Integracja z modułami:
 *     - modules/membership/*
 *     - modules/role/*
 *     - modules/broadcast/*
 *     - TransferLeaderSystem
 *     - AllianceIntegrity
 *
 * ZALEŻNOŚCI:
 * - MutationGate (atomowość)
 * - Repositories (persistencja)
 * - Ownership (uprawnienia globalne)
 *
 * UWAGA ARCHITEKTONICZNA:
 * - Nie używać Discord API bezpośrednio
 * - Operacje atomowe wykonywać przez Orchestrator
 * - getAllianceOrThrow i logAudit są PUBLIC,
 *   ponieważ używa ich TransferLeaderSystem
 *
 * ============================================
 */

// ----------------- IMPORTY -----------------
import { MutationGate } from "../../engine/MutationGate"; // atomowość operacji
import { AllianceRepo, PendingDeletionRepo } from "../../data/Repositories"; // repozytoria
import { Alliance, AllianceRoles, AllianceChannels } from "./AllianceTypes"; // typy sojuszu
import { Ownership } from "../Ownership/ownership"; // folder Ownership, plik ownership.ts
import { AllianceIntegrity } from "./integrity/AllianceIntegrity"; // walidacja i logika integralności
import { BroadcastModule } from "./modules/broadcast/BroadcastModule"; // moduł broadcast
import { RoleModule } from "./modules/role/RoleModule"; // moduł ról
import { TransferLeaderSystem } from "./TransferLeaderSystem"; // transfer lidera
import { db } from "../../data/Database"; // baza danych / journal

// ----------------- TYPY -----------------
export interface PendingDeletionRecord {
  requestedBy: string;
  requestedAt: number;
}

// ----------------- STAŁE -----------------
const MAX_MEMBERS = 100;
const MAX_R4 = 10;

// ----------------- KLASA -----------------
export class AllianceService {

  // ----------------- CREATE -----------------
  static async createAlliance(params: {
    actorId: string;
    guildId: string;
    allianceId: string;
    tag: string;
    name: string;
    leaderId: string;
    roles: AllianceRoles;
    channels: AllianceChannels;
  }): Promise<Alliance> {
    // stub minimalny do builda
    return {} as Alliance;
  }

  // ----------------- MEMBERS -----------------
  static async addMember(actorId: string, allianceId: string, userId: string): Promise<void> {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (this.isMember(alliance, userId)) throw new Error("User is already a member");
    if (this.getTotalMembers(alliance) >= MAX_MEMBERS) throw new Error("Alliance is full");

    alliance.members.r3 = alliance.members.r3 || [];
    alliance.members.r3.push(userId);
    this.checkOrphanState(alliance);
    AllianceRepo.set(allianceId, alliance);

    this.logAudit(allianceId, { action: "addMember", actorId, userId });
  }

  static async promoteToR4(actorId: string, allianceId: string, userId: string): Promise<void> {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (!alliance.members.r3?.includes(userId)) throw new Error("User is not R3");
    alliance.members.r4 = alliance.members.r4 || [];
    if (alliance.members.r4.length >= MAX_R4) throw new Error("Max R4 reached");

    alliance.members.r3 = alliance.members.r3.filter(u => u !== userId);
    alliance.members.r4.push(userId);
    AllianceRepo.set(allianceId, alliance);

    this.logAudit(allianceId, { action: "promoteToR4", actorId, userId });
  }

  static async removeMember(actorId: string, allianceId: string, userId: string): Promise<void> {
    const alliance = this.getAllianceOrThrow(allianceId);

    if (alliance.members.r5 === userId) alliance.members.r5 = null;
    alliance.members.r4 = alliance.members.r4?.filter(u => u !== userId) || [];
    alliance.members.r3 = alliance.members.r3?.filter(u => u !== userId) || [];

    this.checkOrphanState(alliance);
    AllianceRepo.set(allianceId, alliance);

    this.logAudit(allianceId, { action: "removeMember", actorId, userId });
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

    await RoleModule.updateTag(allianceId, newTag); // stub dla builda
    await BroadcastModule.updateTag(allianceId, newTag); // stub dla builda

    this.logAudit(allianceId, { action: "updateTag", actorId, oldTag, newTag });
  }

  static async updateName(actorId: string, allianceId: string, newName: string): Promise<void> {
    const alliance = this.getAllianceOrThrow(allianceId);
    const oldName = alliance.name;

    alliance.name = newName;
    AllianceRepo.set(allianceId, alliance);

    await BroadcastModule.updateName(allianceId, newName); // stub dla builda

    this.logAudit(allianceId, { action: "updateName", actorId, oldName, newName });
  }

  // ----------------- DELETION -----------------
  static requestDelete(actorId: string, allianceId: string): void {
    const alliance = this.getAllianceOrThrow(allianceId);
    PendingDeletionRepo.set(allianceId, alliance);

    this.logAudit(allianceId, { action: "requestDelete", actorId });
  }

  static async confirmDelete(actorId: string, allianceId: string): Promise<void> {
    const alliance = PendingDeletionRepo.get(allianceId);
    if (!alliance) throw new Error("No pending deletion for this alliance");

    PendingDeletionRepo.delete(allianceId);
    AllianceRepo.delete(allianceId);

    await BroadcastModule.removeAlliance(allianceId); // stub dla builda
    await RoleModule.removeRoles(alliance.roles); // stub dla builda

    this.logAudit(allianceId, { action: "confirmDelete", actorId });
  }

  // ----------------- HELPERS -----------------
  public static getAllianceOrThrow(id: string): Alliance {
    const alliance = AllianceRepo.get(id);
    if (!alliance) throw new Error(`Alliance ${id} not found`);
    return alliance;
  }

  private static isMember(alliance: Alliance, userId: string): boolean {
    return alliance.members.r5 === userId
        || alliance.members.r4?.includes(userId)
        || alliance.members.r3?.includes(userId);
  }

  private static getTotalMembers(alliance: Alliance): number {
    return (alliance.members.r5 ? 1 : 0)
         + (alliance.members.r4?.length || 0)
         + (alliance.members.r3?.length || 0);
  }

  private static checkOrphanState(alliance: Alliance): void {
    alliance.orphaned = !alliance.members.r5;
  }

  public static logAudit(
    allianceId: string,
    entry: Omit<{ id: string } & Record<string, any>, "id">
  ): void {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    db.journal.set(id, { id, allianceId, ...entry });
  }

  // ----------------- STUBY DLA BUILD -----------------
  static async fetchGuildMember(guildId: string, userId: string) {
    return { id: userId }; // stub minimalny
  }

  static async updateAlliance(alliance: Alliance) {
    AllianceRepo.set(alliance.id, alliance); // stub do builda
  }

  static async loadAllAlliances() {
    // stub do builda
  }

  static async validateAll() {
    // stub do builda
  }

}