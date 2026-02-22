// src/commands/alliance/updateName.ts

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { SafeMode } from "../../system/SafeMode";

export const UpdateNameCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("update_name")
    .setDescription("Change your alliance name (letters only)")
    .addStringOption(option =>
      option
        .setName("name")
        .setDescription("New alliance name")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const newName = interaction.options.getString("name", true);

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot update name outside a guild.", ephemeral: true });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System in SAFE_MODE – cannot update name.", ephemeral: true });
      return;
    }

    // Walidacja nazwy: tylko litery, min 1, max 32 znaki
    if (!/^[A-Za-z\s]{1,32}$/.test(newName)) {
      await interaction.reply({ content: "❌ Name can only contain letters (A-Z) and spaces, max 32 characters.", ephemeral: true });
      return;
    }

    try {
      // Moduł sojuszu sprawdza, czy użytkownik jest liderem
      await AllianceSystem.updateName(userId, interaction.guild.id, newName);

      await interaction.reply({
        content: `✅ Alliance name has been updated to \`${newName}\`.`,
        ephemeral: false
      });

    } catch (error: any) {
      await interaction.reply({
        content: `❌ Failed to update name: ${error.message}`,
        ephemeral: true
      });
    }
  }
};