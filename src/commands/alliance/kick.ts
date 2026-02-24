// File path: src/commands/alliance/kick.ts
/**
 * ============================================
 * COMMAND: Kick
 * FILE: src/commands/alliance/kick.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Wyrzucanie członka z sojuszu
 * - R5 może wyrzucać wszystkich
 * - R4 może wyrzucać tylko R3
 * - Automatyczne usunięcie ról i członkostwa
 * - Powiadomienie w kanale announce
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { SafeMode } from "../../system/SafeMode";

export const Command: Command = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from your alliance")
    .addUserOption(option =>
      option
        .setName("member")
        .setDescription("Member to kick")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const actorId = interaction.user.id;
    const targetUser = interaction.options.getUser("member", true);

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot kick outside a guild.", ephemeral: true });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System in SAFE_MODE – cannot kick members.", ephemeral: true });
      return;
    }

    try {
      const result = await AllianceSystem.kickMember(actorId, targetUser.id, interaction.guild.id);

      // Powiadomienie w kanale announce (po angielsku)
      if (result.success) {
        await interaction.reply({
          content: `✅ <@${targetUser.id}> has been kicked from the alliance.`,
          ephemeral: false
        });
      } else {
        await interaction.reply({
          content: `❌ You do not have permission to kick <@${targetUser.id}>.`,
          ephemeral: true
        });
      }
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to kick member: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default Command;