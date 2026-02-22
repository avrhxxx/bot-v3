// src/commands/alliance/demote.ts

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { SafeMode } from "../../system/SafeMode";

export const DemoteCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("demote")
    .setDescription("Demote a member to a lower rank in your alliance")
    .addUserOption(option =>
      option
        .setName("member")
        .setDescription("Member to demote")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const targetUser = interaction.options.getUser("member", true);

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot demote outside a guild.", ephemeral: true });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System in SAFE_MODE – cannot demote members.", ephemeral: true });
      return;
    }

    try {
      // Moduł sojuszu sprawdza, czy wykonawca jest liderem
      // oraz czy targetUser należy do sojuszu i jest wyższej rangi niż minimalna
      const result = await AllianceSystem.demoteMember(userId, targetUser.id, interaction.guild.id);
      
      await interaction.reply({
        content: `✅ <@${targetUser.id}> has been demoted to ${result.newRank} in the alliance.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to demote member: ${error.message}`,
        ephemeral: true
      });
    }
  }
};