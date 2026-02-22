// src/system/snapshot/SnapshotTypes.ts

import { HealthState } from "../Health";

/**
 * Snapshot struktury pojedynczej alianse
 */
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

/**
 * Alias używany w Repositories
 */
export type SnapshotRecord = AllianceSnapshot;

/**
 * OwnershipRecord – przechowuje ID użytkownika Discord
 */
export type OwnershipRecord = string;

/**
 * Typ stanu zdrowia systemu
 */
export type HealthStateType = HealthState;