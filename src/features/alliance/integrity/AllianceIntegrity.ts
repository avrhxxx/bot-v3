import { AllianceRepo } from "../../../data/Repositories";
import { Alliance } from "../AllianceTypes";

export class AllianceIntegrity {
  /**
   * EXACT 3 characters
   * Alphanumeric only (A-Z, 0-9)
   */
  static validateTag(tag: string): void {
    if (!tag) {
      throw new Error("Alliance tag is required.");
    }

    const normalized = tag.toUpperCase();
    const regex = /^[A-Z0-9]{3}$/;

    if (!regex.test(normalized)) {
      throw new Error(
        "Alliance tag must be exactly 3 characters long and contain only letters or numbers."
      );
    }
  }

  /**
   * Ensures tag is unique within the same guild
   */
  static ensureTagUnique(guildId: string, tag: string): void {
    const normalized = tag.toUpperCase();
    const alliances = AllianceRepo.getAll();

    const exists = alliances.find(
      (a: Alliance) =>
        a.guildId === guildId &&
        a.tag.toUpperCase() === normalized
    );

    if (exists) {
      throw new Error("Alliance tag already exists in this guild.");
    }
  }

  /**
   * Ensures user belongs to only one alliance globally
   */
  static ensureUserNotInAlliance(userId: string): void {
    const alliances = AllianceRepo.getAll();

    const found = alliances.find((a: Alliance) => {
      return (
        a.members.r5 === userId ||
        a.members.r4.includes(userId) ||
        a.members.r3.includes(userId)
      );
    });

    if (found) {
      throw new Error("User already belongs to an alliance.");
    }
  }

  /**
   * Ensures user does not hold multiple ranks in the same alliance
   */
  static ensureRoleExclusivity(alliance: Alliance, userId: string): void {
    let count = 0;

    if (alliance.members.r5 === userId) count++;
    if (alliance.members.r4.includes(userId)) count++;
    if (alliance.members.r3.includes(userId)) count++;

    if (count > 1) {
      throw new Error(
        "User cannot hold multiple ranks within the same alliance."
      );
    }
  }

  /**
   * Ensures structure consistency:
   * - exactly one R5
   * - no duplicates across r4/r3
   * - no R5 inside r4/r3
   */
  static validateMembersStructure(alliance: Alliance): void {
    const { r5, r4, r3 } = alliance.members;

    if (!r5) {
      throw new Error("Alliance must have exactly one R5 leader.");
    }

    if (r4.includes(r5) || r3.includes(r5)) {
      throw new Error("R5 cannot exist in R4 or R3.");
    }

    const uniqueR4 = new Set(r4);
    const uniqueR3 = new Set(r3);

    if (uniqueR4.size !== r4.length) {
      throw new Error("Duplicate users detected in R4.");
    }

    if (uniqueR3.size !== r3.length) {
      throw new Error("Duplicate users detected in R3.");
    }

    for (const user of r4) {
      if (r3.includes(user)) {
        throw new Error("User cannot exist in both R4 and R3.");
      }
    }
  }
}