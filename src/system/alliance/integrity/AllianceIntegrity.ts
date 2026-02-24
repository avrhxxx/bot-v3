/**
 * ============================================
 * FILE: src/system/alliance/integrity/AllianceIntegrity.ts
 * LAYER: SYSTEM (Alliance Integrity & Validation)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Sprawdza spójność sojuszu
 * - Waliduje role, członków, kanały i limity
 * - Zapewnia, że limity członków są zgodne z zasadami (R5 + R4 + R3 ≤ 100, max 10 R4)
 *
 * ZALEŻNOŚCI:
 * - AllianceTypes
 *
 * UWAGA:
 * - Walidacja uwzględnia wszystkie role w jednym limicie
 * - Nie wykonuje rollbacku – operacje mutacyjne powinny być atomowe
 *
 * ============================================
 */

import { Alliance, AllianceRoles, AllianceChannels, AllianceMember } from "../AllianceTypes";

export class AllianceIntegrity {
  static MAX_MEMBERS = 100;   // limit wszystkich członków (R5+R4+R3)
  static MAX_R4 = 10;         // limit moderatorów

  /**
   * Walidacja całego sojuszu
   */
  static validate(alliance: Alliance): void {
    if (!alliance.roles) throw new Error("Alliance missing roles");
    if (!alliance.channels) throw new Error("Alliance missing channels");
    if (!alliance.members) alliance.members = [];
    if (!alliance.pendingJoins) alliance.pendingJoins = [];

    this.validateRoles(alliance.roles);
    this.validateMembers(alliance.members);
    this.validatePendingJoins(alliance.pendingJoins);
    this.validateChannels(alliance.channels);
    this.validateLeader(alliance.members);
    this.validateLimits(alliance.members);
  }

  private static validateRoles(roles: AllianceRoles) {
    const requiredRoles = ["r5RoleId", "r4RoleId", "r3RoleId", "identityRoleId"];
    for (const r of requiredRoles) {
      if (!roles[r as keyof AllianceRoles]) {
        throw new Error(`Missing role ID: ${r}`);
      }
    }
  }

  private static validateMembers(members: AllianceMember[]) {
    for (const m of members) {
      if (!["R3", "R4", "R5"].includes(m.role)) {
        throw new Error(`Invalid role for member ${m.userId}: ${m.role}`);
      }
      if (!m.userId) throw new Error("Member missing userId");
    }
  }

  private static validatePendingJoins(pending: { userId: string; requestedAt: number }[]) {
    const seen = new Set<string>();
    for (const j of pending) {
      if (!j.userId || !j.requestedAt) throw new Error("Pending join entry invalid");
      if (seen.has(j.userId)) throw new Error(`Duplicate pending join: ${j.userId}`);
      seen.add(j.userId);
    }
  }

  private static validateChannels(channels: AllianceChannels) {
    const requiredChannels = [
      "categoryId",
      "leadershipChannelId",
      "officersChannelId",
      "membersChannelId",
      "joinChannelId",
    ];
    for (const c of requiredChannels) {
      if (!channels[c as keyof AllianceChannels]) {
        throw new Error(`Missing channel ID: ${c}`);
      }
    }
  }

  private static validateLeader(members: AllianceMember[]) {
    const leaders = members.filter(m => m.role === "R5");
    if (leaders.length > 1) throw new Error("Multiple leaders detected");
  }

  private static validateLimits(members: AllianceMember[]) {
    const r4Count = members.filter(m => m.role === "R4").length;
    const totalCount = members.length; // R5 + R4 + R3 razem

    if (r4Count > this.MAX_R4) {
      throw new Error(`Too many R4 members: ${r4Count}`);
    }

    if (totalCount > this.MAX_MEMBERS) {
      throw new Error(`Too many total members (R5+R4+R3): ${totalCount}`);
    }
  }
}

/**
 * ============================================
 * FILEPATH: src/system/alliance/integrity/AllianceIntegrity.ts
 * ============================================
 */