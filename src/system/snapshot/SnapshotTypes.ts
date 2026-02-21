export interface AllianceSnapshot {
  allianceId: string;
  checksum: string;
  memberCount: number;
  r4Count: number;
  r3Count: number;
  orphaned: boolean;
  createdAt: number;
  snapshotAt: number;
}