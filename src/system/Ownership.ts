import { OwnershipRepo } from "../data/Repositories";
import { MutationGate } from "../engine/MutationGate";
import { SafeMode } from "./SafeMode";

const BOT_OWNER_KEY = "BOT_OWNER";
const DISCORD_OWNER_KEY = "DISCORD_OWNER";

export class Ownership {
  static initialize(botOwnerId: string, discordOwnerId: string) {
    if (!OwnershipRepo.get(BOT_OWNER_KEY)) {
      OwnershipRepo.set(BOT_OWNER_KEY, botOwnerId);
    }

    if (!OwnershipRepo.get(DISCORD_OWNER_KEY)) {
      OwnershipRepo.set(DISCORD_OWNER_KEY, discordOwnerId);
    }
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

  static async transferBotOwner(
    actorId: string,
    newOwnerId: string,
    healthState: string
  ) {
    if (!this.isBotOwner(actorId)) {
      throw new Error("Only current Bot Owner can transfer ownership");
    }

    if (SafeMode.isActive()) {
      throw new Error("Cannot transfer during SAFE_MODE");
    }

    if (healthState !== "HEALTHY") {
      throw new Error("Cannot transfer unless system HEALTHY");
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

  static async setDiscordOwner(
    actorId: string,
    newOwnerId: string
  ) {
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
}