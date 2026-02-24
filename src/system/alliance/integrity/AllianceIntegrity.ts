/**
 * ============================================
 * FILE: src/system/alliance/integrity/AllianceIntegrity.ts
 * LAYER: SYSTEM (Alliance Integrity & Validation)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Validate overall alliance integrity
 * - Ensure roles, members, channels, and limits are correct
 * - Enforce membership limits (R5 + R4 + R3 ≤ 100, max 10 R4)
 *
 * DEPENDENCIES:
 * - AllianceTypes
 *
 * NOTE:
 * - Validation considers all roles in total limits
 * - No rollback is performed – mutations should be atomic
 *
 * ============================================
 */

import { Alliance, AllianceRoles, AllianceChannels, AllianceMember } from "../AllianceTypes";

export class AllianceIntegrity {
  static MAX_MEMBERS = 100;   // Total members limit (R5+R4+R3)
  static MAX_R4 = 10;         // Maximum moderators (R4)

  /**
   * Validate the entire alliance
   */
  static validate(alliance: Alliance): void {
    if (!alliance.roles) throw new Error("Alliance missing roles");
    if (!alliance.channels) throw new Error("Alliance missing channels");

    // Ensure arrays exist
    if (!alliance.members) alliance.members = [];
    if (!alliance.pendingJoins) alliance.pendingJoins = [];

    this.validateRoles(alliance.roles);
    this.validateMembers(alliance.members);
    this.validatePendingJoins(alliance.pendingJoins);
    this.validateChannels(alliance.channels);
    this.validateLeader(alliance.members);
    this.validateLimits(alliance.members);
  }

  /** Validate that all required roles exist */
  private static validateRoles(roles: AllianceRoles) {
    const requiredRoles = ["r5RoleId", "r4RoleId", "r3RoleId", "identityRoleId"];
    for (const r of requiredRoles) {
      if (!roles[r as keyof AllianceRoles]) {
        throw new Error(`Missing role ID: ${r}`);
      }
    }
  }

  /** Validate that members have correct roles and userIds */
  private static validateMembers(members: AllianceMember[]) {
    for (const m of members) {
      if (!["R3", "R4", "R5"].includes(m.role)) {
        throw new Error(`Invalid role for member ${m.userId}: ${m.role}`);
      }
      if (!m.userId) throw new Error("Member missing userId");
    }
  }

  /** Validate that pending join requests are correct and unique */
  private static validatePendingJoins(pending: { userId: string; requestedAt: number }[]) {
    const seen = new Set<string>();
    for (const j of pending) {
      if (!j.userId || !j.requestedAt) throw new Error("Pending join entry invalid");
      if (seen.has(j.userId)) throw new Error(`Duplicate pending join: ${j.userId}`);
      seen.add(j.userId);
    }
  }

  /** Validate that all required channels exist */
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

  /** Ensure there is only one leader (R5) */
  private static validateLeader(members: AllianceMember[]) {
    const leaders = members.filter(m => m.role === "R5");
    if (leaders.length > 1) throw new Error("Multiple leaders detected");
  }

  /** Validate total members and R4 limits */
  private static validateLimits(members: AllianceMember[]) {
    const r4Count = members.filter(m => m.role === "R4").length;
    const totalCount = members.length; // Total R5 + R4 + R3

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