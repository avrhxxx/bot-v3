// src/journal/JournalTypes.ts
export interface JournalEntry {
  id: number;                 // unikalne ID wpisu
  operation: string;
  actor: string;
  allianceId?: string;
  timestamp: number;
  status: string;             // PENDING | EXECUTED | CONFIRMED | ABORTED
  error?: string;             // opcjonalny komunikat błędu
}