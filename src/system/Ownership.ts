import { OwnershipRepo } from "../data/Repositories";
import { MutationGate } from "../engine/MutationGate";
import { SafeMode } from "./SafeMode";

const BOT_OWNER_KEY = "BOT_OWNER";
const DISCORD_OWNER_KEY = "DISCORD_OWNER";

export class Ownership {
  // -----------------------
  // Initialization
  // -----------------------
  static initialize(botOwnerId: string, discordOwnerId: string) {
    if (!OwnershipRepo.get(BOT_OWNER_KEY)) {
      OwnershipRepo.set(BOT_OWNER_KEY, botOwnerId);
    }

    if (!OwnershipRepo.get(DISCORD_OWNER_KEY)) {
      OwnershipRepo.set(DISCORD_OWNER_KEY, discordOwnerId);
    }
  }

  // -----------------------
  // Getters
  // -----------------------
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

  // -----------------------
  // Transfer Bot Owner
  // -----------------------
  static async transferBotOwner(
    actorId: string,
    newOwnerId: string,
    healthState: string
  ) {
    if (!this.isBotOwner(actorId)) {
      throw new Error("Only current Bot Owner can transfer ownership");
    }

    if (SafeMode.isEnabled()) {
      throw new Error("Cannot transfer during SAFE_MODE");
    }

    if (healthState !== "HEALTHY") {
      throw new Error("Cannot transfer unless system HEALTHY");
    }

    const currentOwner = this.getBotOwner();

    await MutationGate.execute(
      {
        operation: "BOT_OWNER_TRANSFER",
        actor: actorId,
        target: newOwnerId,
        preState: { currentOwner }
      },
      async () => {
        OwnershipRepo.set(BOT_OWNER_KEY, newOwnerId);
      },
      {
        requireGlobalLock: true
      }
    );
  }

  // -----------------------
  // Discord Owner set
  // Governance only
  // -----------------------
  static async setDiscordOwner(
    actorId: string,
    newOwnerId: string
  ) {
    if (!this.isBotOwner(actorId)) {
      throw new Error("Only Bot Owner can set Discord Owner");
    }

    const currentOwner = this.getDiscordOwner();

    await MutationGate.execute(
      {
        operation: "DISCORD_OWNER_SET",
        actor: actorId,
        target: newOwnerId,
        preState: { currentOwner }
      },
      async () => {
        OwnershipRepo.set(DISCORD_OWNER_KEY, newOwnerId);
      },
      {
        requireGlobalLock: true
      }
    );
  }
}