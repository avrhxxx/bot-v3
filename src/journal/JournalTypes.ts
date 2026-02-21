export type JournalStatus =
  | "PENDING"
  | "EXECUTED"
  | "CONFIRMED"
  | "ABORTED";

export interface JournalEntry {
  id: string;
  operation: string;
  actor: string;
  allianceId?: string;
  timestamp: number;
  preStateHash?: string;
  status: JournalStatus;
  error?: string;
}