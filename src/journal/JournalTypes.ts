// src/journal/JournalTypes.ts
export interface JournalEntry {
  operation: string;
  actor: string;
  status: string;
  message: string;
  timestamp: Date;
}