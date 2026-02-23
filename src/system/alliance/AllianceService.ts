// src/system/alliance/AllianceService.ts

/**
 * Blueprint AllianceService – nowy moduł systemowy
 *
 * Cel: centralny serwis logiki sojuszu w systemie.
 * Integruje się z:
 * - MembershipModule – join/leave
 * - RoleModule – role i uprawnienia
 * - BroadcastModule – powiadomienia do kanału announce
 * - TransferLeaderSystem – transfer lidera
 * - AllianceIntegrity – monitorowanie spójności
 */

import { MutationGate } from "../../engine/MutationGate";
import { AllianceRepo, PendingDeletionRepo, db } from "../../data/Repositories";
import { Alliance, AllianceRoles, AllianceChannels } from "./AllianceTypes";
import { Ownership } from "../Ownership";
import { AllianceIntegrity } from "./integrity/AllianceIntegrity";

export interface PendingDeletionRecord {
  requestedBy: string;
  requestedAt: number;
}

const MAX_MEMBERS = 100;
const MAX_R4 = 10;

export class AllianceService {
  // ----------------- CREATE -----------------
  /**
   * Tworzy nowy sojusz.
   * Wywołanie tylko przez Discord Owner.
   * Integracja: MutationGate, AllianceIntegrity, AllianceRepo, logAudit
   */
  static async createAlliance(params: {
    actorId: string;
    guildId: string;
    allianceId: string;
    tag: string;
    name: string;
    leaderId: string;
    roles: AllianceRoles;
    channels: AllianceChannels;
  }) { /* implementacja */ }

  // ----------------- MEMBERS -----------------
  /**
   * Dodaje członka do sojuszu
   * Integracja: MembershipModule, MutationGate, AllianceIntegrity
   */
  static async addMember(actorId: string, allianceId: string, userId: string) { /* implementacja */ }

  /**
   * Promuje członka do R4
   * Integracja: RoleModule, MutationGate, AllianceIntegrity
   */
  static async promoteToR4(actorId: string, allianceId: string, userId: string) { /* implementacja */ }

  /**
   * Usuwa członka z sojuszu
   * Integracja: MembershipModule, RoleModule, MutationGate, AllianceIntegrity
   */
  static async removeMember(actorId: string, allianceId: string, userId: string) { /* implementacja */ }

  // ----------------- LEADERSHIP -----------------
  /**
   * Transfer lidera
   * Integracja: TransferLeaderSystem, MutationGate, AllianceIntegrity
   */
  static async transferLeadership(actorId: string, allianceId: string, newLeaderId: string) { /* implementacja */ }

  // ----------------- DELETION -----------------
  /**
   * Zgłoszenie usunięcia sojuszu (Discord Owner)
   */
  static requestDelete(actorId: string, allianceId: string) { /* implementacja */ }

  /**
   * Potwierdzenie usunięcia sojuszu
   */
  static async confirmDelete(actorId: string, allianceId: string) { /* implementacja */ }

  // ----------------- HELPERS -----------------
  private static getAllianceOrThrow(id: string): Alliance { /* implementacja */ }
  private static isMember(alliance: Alliance, userId: string): boolean { /* implementacja */ }
  private static getTotalMembers(alliance: Alliance): number { /* implementacja */ }
  private static checkOrphanState(alliance: Alliance) { /* implementacja */ }
  private static logAudit(allianceId: string, entry: Omit<{ id: string } & Record<string, any>, "id">) { /* implementacja */ }
}