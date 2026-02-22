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
      if (a.members.r5 === userId) return true;
      if (a.members.r4.includes(userId)) return true;
      if (a.members.r3.includes(userId)) return true;
      return false;
    });

    if (found) {
      throw new Error("User already belongs to an alliance.");
    }
  }

  /**
   * Ensures user does not have multiple ranks in the same alliance
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
   * Ensures there is only one R5 (leader)
   */
  static ensureSingleR5(alliance: Alliance): void {
    if (!alliance.members.r5) {
      throw new Error("Alliance must have exactly one R5 leader.");
    }
  }
}