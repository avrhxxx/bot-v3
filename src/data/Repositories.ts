// src/data/Repositories.ts

import { db } from "./Database";
import type { Alliance } from "../AllianceServices";
import type { OwnershipRecord } from "./Database";

/**
 * =====================================================
 * REPOSITORY LAYER – Bot-V3 (Memory Mode)
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
  },

  exists(id: string): boolean {
    return db.alliances.has(id);
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
  },

  exists(key: string): boolean {
    return db.ownership.has(key);
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
  },

  getAll(): Alliance[] {
    return Array.from(db.pendingDeletions.values());
  },

  exists(id: string): boolean {
    return db.pendingDeletions.has(id);
  }
};

export { db };