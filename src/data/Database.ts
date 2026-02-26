// src/data/Database.ts

// Minimal domain types (temporary clean-build stubs)

type Alliance = {
  id: string;
};

type OwnershipRecord = {
  userId: string;
};

type JournalEntry = {
  id: string;
  timestamp: number;
};

/**
 * Central in-memory database for Bot-V3
 */
export class Database {
  public alliances: Map<string, Alliance> = new Map();

  public ownership: Map<string, OwnershipRecord> = new Map();

  public pendingDeletions: Map<string, Alliance> = new Map();

  public journal: Map<string, JournalEntry> = new Map();
}

export const db = new Database();