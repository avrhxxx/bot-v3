// src/commands/sys/setup.ts

import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { Ownership } from "../../system/Ownership";
import { Health } from "../../system/Health";
import { SafeMode } from "../../system/SafeMode";

export const SysSetupCommand = {
  name: "setup",
  description: "Bootstrap system ownership (BotOwner + DiscordOwner)",
  ownerOnly: true, // tylko właściciel bota może wywołać po inicjalizacji
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // 1️⃣ Sprawdzenie uprawnień Discord Administrator
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({
          content: "⛔ You need Discord Administrator permissions to run this command.",
          ephemeral: true,
        });
        return;
      }

      // 2️⃣ Sprawdzenie, czy BotOwner już istnieje
      const existingBotOwner = Ownership.getBotOwner();
      if (existingBotOwner) {
        await interaction.reply({
          content: `⚠️ System already initialized. BotOwner: <@${existingBotOwner}>`,
          ephemeral: true,
        });
        return;
      }

      // 3️⃣ Inicjalizacja ownership
      const botOwnerId = interaction.user.id;
      const discordOwnerId = interaction.guild?.ownerId;

      if (!discordOwnerId) {
        await interaction.reply({
          content: "❌ Cannot determine Discord server owner.",
          ephemeral: true,
        });
        return;
      }

      await Ownership.initialize(botOwnerId, discordOwnerId);

      // 4️⃣ Weryfikacja integralności po inicjalizacji
      Ownership.enforceInvariant();

      await interaction.reply({
        content: `✅ System initialized successfully.\nBotOwner: <@${botOwnerId}>\nDiscordOwner: <@${discordOwnerId}>`,
        ephemeral: true,
      });
    } catch (error: any) {
      console.error("SysSetupCommand error:", error);

      // Eskalacja SafeMode w razie krytycznego błędu
      SafeMode.activate("SYS_SETUP_FAILURE");

      await interaction.reply({
        content: `❌ Failed to initialize system: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};