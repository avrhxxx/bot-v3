// src/data/Database.ts

import { Alliance } from "../system/alliance/AllianceTypes";
import { OwnershipRecord } from "../system/Ownership";
import { JournalEntry } from "../journal/JournalTypes";

/**
 * Central in-memory database for Bot-V3
 *
 * ⚠️ This database is purely domain-focused.
 * It does NOT handle:
 * - health monitoring
 * - snapshots
 * - safe mode
 * - integrity systems
 *
 * Those legacy systems were intentionally removed
 * to keep the architecture clean and deterministic.
 */
export class Database {
  /**
   * Alliances storage
   * Key: allianceId (or guildId depending on usage context)
   */
  public alliances: Map<string, Alliance> = new Map();

  /**
   * Ownership mapping
   * Stores authority configuration for the bot.
   *
   * Typical keys:
   * - "authority"
   * - "botOwner"
   *
   * (Visual Discord role name like "Shadow Authority"
   * is resolved elsewhere in Ownership layer.)
   */
  public ownership: Map<string, OwnershipRecord> = new Map();

  /**
   * Alliances pending deletion
   *
   * Used for:
   * - soft delete confirmation
   * - rollback safety
   *
   * This is domain-safe and NOT related to legacy snapshot system.
   */
  public pendingDeletions: Map<string, Alliance> = new Map();

  /**
   * Journal storage
   *
   * Stores executed domain operations.
   * Key example:
   * timestamp-operationId
   *
   * Journal is part of the new deterministic domain audit layer.
   */
  public journal: Map<string, JournalEntry> = new Map();
}

/**
 * Singleton instance of Database
 *
 * NOTE:
 * This is intentionally kept simple.
 * No health state.
 * No snapshot mirror.
 * No integrity monitor.
 */
export const db = new Database();