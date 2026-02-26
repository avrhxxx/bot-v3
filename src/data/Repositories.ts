// src/data/Repositories.ts

import { db } from "./Database";
import { Alliance } from "../system/alliance/AllianceTypes";
import { OwnershipRecord } from "../system/Ownership";

/**
 * =====================================================
 * REPOSITORY LAYER – Bot-V3
 * =====================================================
 *
 * This file exposes controlled access to the in-memory
 * domain database.
 *
 * Removed legacy systems:
 * - SnapshotRepo ❌
 * - HealthRepo ❌
 *
 * Architecture is now:
 * Database → Repository → Domain Systems
 *
 * No monitoring, no snapshot mirror, no health layer.
 * Pure domain state only.
 * =====================================================
 */

// ---------------------------
// ALLIANCE REPOSITORY
// ---------------------------
export const AllianceRepo = {
  get(id: string): Alliance | undefined {
    return db.alliances.get(id);
  },

  set(id: string, value: Alliance): void {
    db.alliances.set(id, value);
  },

  delete(id: string): void {
    db.alliances.delete(id);
  },

  getAll(): Alliance[] {
    return Array.from(db.alliances.values());
  }
};

// ---------------------------
// OWNERSHIP REPOSITORY
// ---------------------------
export const OwnershipRepo = {
  get(key: string): OwnershipRecord | undefined {
    return db.ownership.get(key);
  },

  set(key: string, value: OwnershipRecord): void {
    db.ownership.set(key, value);
  }
};

// ---------------------------
// PENDING DELETION REPOSITORY
// ---------------------------
export const PendingDeletionRepo = {
  get(id: string): Alliance | undefined {
    return db.pendingDeletions.get(id);
  },

  set(id: string, value: Alliance): void {
    db.pendingDeletions.set(id, value);
  },

  delete(id: string): void {
    db.pendingDeletions.delete(id);
  }
};

// ---------------------------
// Direct DB export (intentional)
// Used by advanced internal services only
// ---------------------------
export { db };