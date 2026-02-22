// File path: src/commands/alliance/join.ts

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { SafeMode } from "../../system/SafeMode";

/**
 * JoinCommand
 * ----------------
 * Allows a user to join an alliance if they are not already in one.
 */
export const Command: Command = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Join an alliance (only if not already in one)"),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot join alliance outside a guild.", ephemeral: true });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System in SAFE_MODE – cannot join alliance.", ephemeral: true });
      return;
    }

    try {
      const result = await AllianceSystem.joinAlliance(userId, interaction.guild.id);
      await interaction.reply({
        content: `✅ You have successfully joined the alliance \`${result.tag}\`.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to join alliance: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default Command;