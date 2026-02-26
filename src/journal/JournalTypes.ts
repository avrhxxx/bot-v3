export interface JournalEntry {
  id: number;
  operation: string;
  actor: string;
  allianceId?: string;
  timestamp: number;
  status: string;
  error?: string;
}