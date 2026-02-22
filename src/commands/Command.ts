import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export interface Command {
  data: SlashCommandBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;

  /**
   * If true, only BotOwner can execute.
   */
  ownerOnly?: boolean;
}