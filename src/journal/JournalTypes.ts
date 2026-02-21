export type JournalStatus =
  | "PENDING"
  | "EXECUTED"
  | "CONFIRMED"
  | "ABORTED";

export interface JournalEntry {
  id: string;

  timestamp: number;

  operation: string;
  actor: string;
  target?: string;

  alliance_id?: string;

  pre_state_hash: string;

  status: JournalStatus;
}