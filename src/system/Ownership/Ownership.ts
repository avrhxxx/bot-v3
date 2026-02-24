/**
 * ============================================
 * FILE: src/system/Ownership/Ownership.ts
 * LAYER: SYSTEM (Ownership & Security)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Przechowywanie i kontrola właścicieli bota i serwera Discord
 * - Walidacja i transfer własności
 * - Współpraca z SafeMode, MutationGate i Health
 *
 * ZALEŻNOŚCI:
 * - OwnershipRepo (persistencja danych)
 * - MutationGate (atomiczne operacje i blokady globalne)
 * - SafeMode (tryb bezpieczny systemu)
 * - Health (monitorowanie stanu systemu)
 *
 * UWAGA:
 * - Wszystkie operacje mutujące wymagają MutationGate
 * - enforceInvariant aktywuje SafeMode jeśli brak Bot Ownera
 *
 * ============================================
 */

// ----------------- IMPORTY -----------------
// Poprawione ścieżki po przeniesieniu plików Ownership do folderu Ownership/
import { OwnershipRepo } from "../data/Repositories";
import { MutationGate } from "../engine/MutationGate";
import { SafeMode } from "./Ownership/SafeMode"; // <- nowa ścieżka
import { Health } from "./Ownership/Health"; // <- nowa ścieżka

// ----------------- KLUCZE -----------------
const BOT_OWNER_KEY = "BOT_OWNER";
const DISCORD_OWNER_KEY = "DISCORD_OWNER";

export class Ownership {
  // ----------------- INITIALIZATION -----------------
  static async initialize(botOwnerId: string, discordOwnerId: string) {
    await MutationGate.execute(
      {
        operation: "OWNERSHIP_INITIALIZE",
        actor: botOwnerId,
        requireGlobalLock: true
      },
      async () => {
        const existingBotOwner = OwnershipRepo.get(BOT_OWNER_KEY);
        if (existingBotOwner) {
          throw new Error("Bot Owner is already initialized and cannot be overwritten.");
        }

        OwnershipRepo.set(BOT_OWNER_KEY, botOwnerId);
        OwnershipRepo.set(DISCORD_OWNER_KEY, discordOwnerId);
      }
    );
  }

  // ----------------- GETTERS -----------------
  static getBotOwner(): string | undefined {
    return OwnershipRepo.get(BOT_OWNER_KEY);
  }

  static getDiscordOwner(): string | undefined {
    return OwnershipRepo.get(DISCORD_OWNER_KEY);
  }

  static isBotOwner(userId: string): boolean {
    return this.getBotOwner() === userId;
  }

  static isDiscordOwner(userId: string): boolean {
    return this.getDiscordOwner() === userId;
  }

  // ----------------- TRANSFERS -----------------
  static async transferBotOwner(actorId: string, newOwnerId: string) {
    if (!this.isBotOwner(actorId)) {
      throw new Error("Only the current Bot Owner can transfer ownership.");
    }

    if (SafeMode.isActive()) {
      throw new Error("Ownership transfer is blocked: system is in SAFE_MODE.");
    }

    const health = Health.get();
    if (health.state !== "HEALTHY") {
      throw new Error("Ownership transfer blocked: system health is not HEALTHY.");
    }

    await MutationGate.execute(
      {
        operation: "BOT_OWNER_TRANSFER",
        actor: actorId,
        requireGlobalLock: true
      },
      async () => {
        OwnershipRepo.set(BOT_OWNER_KEY, newOwnerId);
      }
    );
  }

  static async setDiscordOwner(actorId: string, newOwnerId: string) {
    if (!this.isBotOwner(actorId)) {
      throw new Error("Only the Bot Owner can assign the Discord Owner.");
    }

    await MutationGate.execute(
      {
        operation: "DISCORD_OWNER_SET",
        actor: actorId,
        requireGlobalLock: true
      },
      async () => {
        OwnershipRepo.set(DISCORD_OWNER_KEY, newOwnerId);
      }
    );
  }

  // ----------------- INVARIANTS -----------------
  static enforceInvariant() {
    const botOwner = OwnershipRepo.get(BOT_OWNER_KEY);

    if (!botOwner) {
      SafeMode.activate("BOT_OWNER_MISSING");
    }
  }
}