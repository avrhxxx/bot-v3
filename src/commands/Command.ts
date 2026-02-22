// File path: src/commands/Command.ts

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder
} from "discord.js";

/**
 * Base Command interface.
 */
export interface Command {
  /**
   * Slash command definition.
   */
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;

  /**
   * Execution logic.
   */
  execute(interaction: ChatInputCommandInteraction): Promise<void>;

  /**
   * Owner-only command flag.
   */
  ownerOnly?: boolean;

  /**
   * System-layer command flag.
   */
  systemLayer?: boolean;
}