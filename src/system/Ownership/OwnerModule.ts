/**
 * ============================================
 * FILE: src/system/OwnerModule/OwnerModule.ts
 * LAYER: SYSTEM / Ownership
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Weryfikacja uprawnień użytkowników
 * - Obsługa Bot Ownera i Discord Guild Ownera
 * - Metody do rzucania błędów przy braku uprawnień
 *
 * ZALEŻNOŚCI:
 * - discord.js (Client, Guild)
 *
 * ============================================
 */

import { Guild } from "discord.js";

export class OwnerModule {
  private static botOwners: Set<string> = new Set();

  /**
   * Inicjalizacja modułu z listą bot ownerów (ID Discord)
   */
  static init(botOwnerIds: string[]) {
    this.botOwners = new Set(botOwnerIds);
  }

  /**
   * Sprawdza czy dany userId jest bot ownerem
   */
  static isBotOwner(userId: string): boolean {
    return this.botOwners.has(userId);
  }

  /**
   * Sprawdza czy dany userId jest właścicielem guild
   */
  static isGuildOwner(userId: string, guild: Guild): boolean {
    return guild.ownerId === userId;
  }

  /**
   * Weryfikuje bot ownera i rzuca błąd jeśli brak uprawnień
   */
  static requireBotOwner(userId: string) {
    if (!this.isBotOwner(userId)) {
      throw new Error("User is not a Bot Owner.");
    }
  }

  /**
   * Weryfikuje właściciela serwera i rzuca błąd jeśli brak uprawnień
   */
  static requireGuildOwner(userId: string, guild: Guild) {
    if (!this.isGuildOwner(userId, guild)) {
      throw new Error("User is not the Discord Guild Owner.");
    }
  }

  /**
   * Sprawdzenie czy user jest właścicielem globalnie (bot owner lub guild owner)
   */
  static isOwner(userId: string, guild?: Guild): boolean {
    if (this.isBotOwner(userId)) return true;
    if (guild && this.isGuildOwner(userId, guild)) return true;
    return false;
  }

  /**
   * Wymusza właściciela globalnego (bot lub guild) i rzuca błąd jeśli brak uprawnień
   */
  static requireOwner(userId: string, guild?: Guild) {
    if (!this.isOwner(userId, guild)) {
      throw new Error("User is not an owner (Bot Owner or Guild Owner).");
    }
  }
}