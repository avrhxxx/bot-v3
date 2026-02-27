// src/data/Database.ts

import type { Alliance } from '../AllianceServices';

export type OwnershipRecord = {
  userId: string;
};

export type JournalEntry = {
  id: string;
  timestamp: number;
};

export class Database {
  public alliances: Map<string, Alliance> = new Map();

  public ownership: Map<string, OwnershipRecord> = new Map();

  public pendingDeletions: Map<string, Alliance> = new Map();

  public journal: Map<string, JournalEntry> = new Map();
}

export const db = new Database();