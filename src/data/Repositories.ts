import { Database } from "./Database";

const db = Database.getInstance();

export const AllianceRepo = {
  get(id: string) {
    return db.alliances.get(id);
  },

  set(id: string, value: any) {
    db.alliances.set(id, value);
  },

  delete(id: string) {
    db.alliances.delete(id);
  }
};

export const JournalRepo = {
  set(id: string, entry: any) {
    db.journal.set(id, entry);
  },

  get(id: string) {
    return db.journal.get(id);
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