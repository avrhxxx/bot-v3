// File path: src/commands/alliance/kick.ts
/**
 * ============================================
 * COMMAND: Kick
 * FILE: src/commands/alliance/kick.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Kick a member from the alliance
 * - R5 can kick anyone
 * - R4 can kick only R3
 * - Automatically removes roles and membership
 * - Sends a notification in the announce channel
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { SafeMode } from "../../system/SafeMode";

export const KickCommand: Command = {
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
      // 1️⃣ Attempt to kick via AllianceSystem
      const result = await AllianceSystem.kickMember(actorId, targetUser.id, interaction.guild.id);

      // 2️⃣ Reply based on success
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

export default KickCommand;