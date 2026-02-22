// File path: src/commands/Command.ts

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

/**
 * Base Command interface used across the entire system.
 * Every slash command must implement this structure.
 */
export interface Command {
  /**
   * Slash command metadata definition.
   */
  data: SlashCommandBuilder;

  /**
   * Command execution logic.
   */
  execute(interaction: ChatInputCommandInteraction): Promise<void>;

  /**
   * If true, only BotOwner can execute.
   */
  ownerOnly?: boolean;

  /**
   * Marks command as system-layer (structural).
   * Used for mutation locks and SAFE_MODE restrictions.
   */
  systemLayer?: boolean;
}