import { db } from "./Database";

export const AllianceRepo = {
  get(id: string) {
    return db.alliances.get(id);
  },

  set(id: string, value: any) {
    db.alliances.set(id, value);
  },

  delete(id: string) {
    db.alliances.delete(id);
  },

  getAll() {
    return Array.from(db.alliances.values());
  }
};

export const OwnershipRepo = {
  get(key: string) {
    return db.ownership.get(key);
  },

  set(key: string, value: any) {
    db.ownership.set(key, value);
  }
};

export const HealthRepo = {
  get(key: string) {
    return db.health.get(key);
  },

  set(key: string, value: any) {
    db.health.set(key, value);
  }
};

export const PendingDeletionRepo = {
  get(id: string) {
    return db.pendingDeletions.get(id);
  },

  set(id: string, value: any) {
    db.pendingDeletions.set(id, value);
  },

  delete(id: string) {
    db.pendingDeletions.delete(id);
  }
};