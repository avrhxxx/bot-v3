// src/commands/alliance/kick.ts

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
    const userId = interaction.user.id;
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
      // Moduł sojuszu sprawdza hierarchię:
      // - Lider może kickować każdego oprócz siebie
      // - Moderator może kickować tylko członków niższych rang
      const result = await AllianceSystem.kickMember(userId, targetUser.id, interaction.guild.id);
      
      await interaction.reply({
        content: `✅ <@${targetUser.id}> has been kicked from the alliance.`,
        ephemeral: false
      });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to kick member: ${error.message}`,
        ephemeral: true
      });
    }
  }
};