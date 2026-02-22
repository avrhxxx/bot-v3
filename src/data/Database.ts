// src/data/Database.ts

import { Alliance } from "../features/alliance/AllianceTypes";
import { OwnershipRecord } from "../system/Ownership";
import { HealthState } from "../system/Health";
import { SnapshotRecord } from "../system/snapshot/SnapshotTypes";
import { JournalEntry } from "../journal/JournalTypes";

/**
 * Central in-memory database for Bot-V3
 * All structures typed and aligned with production spec v3.0
 */
export class Database {
  /**
   * Alliances mapped by guildId or allianceId
   */
  public alliances: Map<string, Alliance> = new Map();

  /**
   * Ownership mapping
   * Keys can be 'botOwner' and 'discordOwner'
   */
  public ownership: Map<string, OwnershipRecord> = new Map();

  /**
   * Health state per system component
   * Example keys: 'core', 'alliance', 'snapshot'
   */
  public health: Map<string, HealthState> = new Map();

  /**
   * Alliances pending deletion
   * Stores allianceId and metadata for rollback / confirmation
   */
  public pendingDeletions: Map<string, Alliance> = new Map();

  /**
   * Snapshots mirror
   * Keyed by allianceId, stores previous states for restore / backup
   */
  public snapshots: Map<string, SnapshotRecord> = new Map();

  /**
   * Journal storage
   * Keyed by unique id (e.g., timestamp + operation), stores executed commands
   */
  public journal: Map<string, JournalEntry> = new Map();
}

/**
 * Singleton instance of Database
 */
export const db = new Database();