/**
 * ============================================
 * MODULE: RulesModule
 * FILE: src/system/alliance/modules/rules/RulesModule.ts
 * LAYER: SYSTEM (Alliance Rules & Validation)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Define and enforce alliance limits and rules
 * - Validate promotions/demotions
 * - Validate member counts
 * - Ensure only one leader exists (R5)
 *
 * DEPENDENCIES:
 * - AllianceService (fetch alliance data)
 *
 * ============================================
 */

import { AllianceService } from "../../AllianceService";
import { Alliance } from "../../AllianceTypes";

export class RulesModule {
  // ----------------- CONSTANTS -----------------
  static readonly MAX_MEMBERS = 100;  // R3 + R4 + R5
  static readonly MAX_R4 = 10;       // max number of R4 members
  static readonly MAX_R5 = 1;        // must be exactly 1 leader

  // ----------------- VALIDATE TOTAL MEMBERS -----------------
  static validateTotalMembers(alliance: Alliance) {
    const totalMembers =
      (alliance.members.r3?.length || 0) +
      (alliance.members.r4?.length || 0) +
      (alliance.members.r5 ? 1 : 0);

    if (totalMembers > this.MAX_MEMBERS) {
      throw new Error(`Alliance cannot exceed ${this.MAX_MEMBERS} members.`);
    }
  }

  // ----------------- VALIDATE R4 COUNT -----------------
  static validateR4Count(alliance: Alliance) {
    const r4Count = alliance.members.r4?.length || 0;
    if (r4Count > this.MAX_R4) {
      throw new Error(`Alliance cannot have more than ${this.MAX_R4} R4 members.`);
    }
  }

  // ----------------- VALIDATE LEADER -----------------
  static validateLeader(alliance: Alliance) {
    if (!alliance.members.r5) {
      throw new Error("Alliance must have exactly one leader (R5).");
    }
  }

  // ----------------- VALIDATE PROMOTION -----------------
  static validatePromotion(alliance: Alliance, targetRole: "R4" | "R5") {
    if (targetRole === "R4") {
      this.validateR4Count(alliance);
      this.validateTotalMembers(alliance);
    } else if (targetRole === "R5") {
      if (alliance.members.r5) {
        throw new Error("Alliance already has a leader (R5).");
      }
      this.validateTotalMembers(alliance);
    }
  }

  // ----------------- VALIDATE DEMOTION -----------------
  static validateDemotion(alliance: Alliance, targetRole: "R3" | "R4") {
    if (targetRole === "R4") this.validateR4Count(alliance);
    this.validateTotalMembers(alliance);
  }

  // ----------------- VALIDATE NEW MEMBER -----------------
  static validateNewMember(alliance: Alliance) {
    this.validateTotalMembers(alliance);
  }
}