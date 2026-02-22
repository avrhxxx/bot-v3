import { db } from "./Database";
import { Alliance } from "../features/alliance/AllianceTypes";
import { SnapshotRecord, OwnershipRecord, HealthState } from "../system/snapshot/SnapshotTypes";

// ---------------------------
// ALLIANCE REPO
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
    return Array.from(db.alliances.values()) as Alliance[];
  }
};

// ---------------------------
// SNAPSHOT REPO
// ---------------------------
export const SnapshotRepo = {
  get(id: string): SnapshotRecord | undefined {
    return db.snapshots.get(id);
  },
  set(id: string, value: SnapshotRecord): void {
    db.snapshots.set(id, value);
  },
  getAll(): SnapshotRecord[] {
    return Array.from(db.snapshots.values()) as SnapshotRecord[];
  }
};

// ---------------------------
// OWNERSHIP REPO
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
// HEALTH REPO
// ---------------------------
export const HealthRepo = {
  get(key: string): HealthState | undefined {
    return db.health.get(key);
  },
  set(key: string, value: HealthState): void {
    db.health.set(key, value);
  }
};

// ---------------------------
// PENDING DELETION REPO
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