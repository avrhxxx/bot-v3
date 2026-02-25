/**
 * ============================================
 * FILE: src/system/snapshot/SnapshotService.ts
 * LAYER: SNAPSHOT / INTEGRITY MANAGEMENT
 * ============================================
 *
 * RESPONSIBILITIES:
 * - Create and verify alliance snapshots
 * - Track member counts and checksums for integrity
 * - Detect corrupted alliances
 *
 * DEPENDENCIES:
 * - AllianceRepo, SnapshotRepo from data repositories
 * - Alliance types
 * - crypto module
 */

import crypto from "crypto";
import { AllianceRepo, SnapshotRepo } from "../../data/Repositories";
import { Alliance } from "../../features/alliance/AllianceTypes";

export class SnapshotService {
  /**
   * Create a snapshot for a given alliance
   */
  static createSnapshot(alliance: Alliance) {
    const checksum = this.calculateChecksum(alliance);

    SnapshotRepo.set(alliance.id, {
      allianceId: alliance.id,
      checksum,
      memberCount:
        (alliance.members.r5 ? 1 : 0) +
        alliance.members.r4.length +
        alliance.members.r3.length,
      r5Count: alliance.members.r5 ? 1 : 0,
      r4Count: alliance.members.r4.length,
      r3Count: alliance.members.r3.length,
      orphaned: alliance.orphaned,
      createdAt: alliance.createdAt,
      snapshotAt: Date.now(),
    });
  }

  /**
   * Verify if a snapshot matches current alliance state
   */
  static verifySnapshot(allianceId: string): boolean {
    const alliance = AllianceRepo.get(allianceId);
    const snapshot = SnapshotRepo.get(allianceId);

    if (!alliance || !snapshot) return false;

    const currentChecksum = this.calculateChecksum(alliance);
    return currentChecksum === snapshot.checksum;
  }

  /**
   * Verify all alliances and return IDs of corrupted ones
   */
  static verifyAll(): string[] {
    const corrupted: string[] = [];
    const alliances = AllianceRepo.getAll();

    for (const alliance of alliances) {
      if (!this.verifySnapshot(alliance.id)) {
        corrupted.push(alliance.id);
      }
    }

    return corrupted;
  }

  /**
   * Calculate SHA-256 checksum of alliance members
   */
  private static calculateChecksum(alliance: Alliance): string {
    const raw = JSON.stringify({
      id: alliance.id,
      r5: alliance.members.r5,
      r4: [...alliance.members.r4].sort(),
      r3: [...alliance.members.r3].sort(),
      orphaned: alliance.orphaned,
    });

    return crypto.createHash("sha256").update(raw).digest("hex");
  }
}