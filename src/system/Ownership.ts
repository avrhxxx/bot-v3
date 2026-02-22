import { OwnershipRepo } from "../data/Repositories";
import { MutationGate } from "../engine/MutationGate";
import { SafeMode } from "./SafeMode";
import { Health } from "./Health";

const BOT_OWNER_KEY = "BOT_OWNER";
const DISCORD_OWNER_KEY = "DISCORD_OWNER";

export class Ownership {
  /**
   * Initialize ownership only if not already set.
   * Must be called through setup command.
   */
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
          throw new Error("Bot Owner already initialized");
        }

        OwnershipRepo.set(BOT_OWNER_KEY, botOwnerId);
        OwnershipRepo.set(DISCORD_OWNER_KEY, discordOwnerId);
      }
    );
  }

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

  /**
   * Transfer Bot Ownership.
   * System must be HEALTHY and not in SafeMode.
   */
  static async transferBotOwner(actorId: string, newOwnerId: string) {
    if (!this.isBotOwner(actorId)) {
      throw new Error("Only current Bot Owner can transfer ownership");
    }

    if (SafeMode.isActive()) {
      throw new Error("Cannot transfer during SAFE_MODE");
    }

    const health = Health.get();

    if (health.state !== "HEALTHY") {
      throw new Error("Cannot transfer unless system is HEALTHY");
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

  /**
   * Set Discord Owner (only Bot Owner can assign).
   */
  static async setDiscordOwner(actorId: string, newOwnerId: string) {
    if (!this.isBotOwner(actorId)) {
      throw new Error("Only Bot Owner can set Discord Owner");
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

  /**
   * Hard invariant check.
   * If BotOwner missing → escalate to SafeMode.
   */
  static enforceInvariant() {
    const botOwner = OwnershipRepo.get(BOT_OWNER_KEY);

    if (!botOwner) {
      SafeMode.activate("BOT_OWNER_MISSING");
    }
  }
}