// src/commands/sys/setup.ts

import { ChatInputCommandInteraction } from "discord.js";
import { Ownership } from "../../system/Ownership";
import { SafeMode } from "../../system/SafeMode";

export const SysSetupCommand = {
  name: "setup",
  description: "Bootstrap system ownership (BotOwner Only)",
  ownerOnly: true, // tylko BotOwner może wywołać
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const userId = interaction.user.id;

      // ✅ Sprawdzenie, czy system już zainicjalizowany
      const existingBotOwner = Ownership.getBotOwner();
      if (existingBotOwner) {
        // Tylko aktualny BotOwner może wywołać po inicjalizacji
        if (existingBotOwner !== userId) {
          await interaction.reply({
            content: `⛔ Only the BotOwner can run this command.\nCurrent BotOwner: <@${existingBotOwner}>`,
            ephemeral: true,
          });
          return;
        }
      }

      // 1️⃣ Inicjalizacja ownership
      const botOwnerId = userId;
      const discordOwnerId = interaction.guild?.ownerId;

      if (!discordOwnerId) {
        await interaction.reply({
          content: "❌ Cannot determine Discord server owner.",
          ephemeral: true,
        });
        return;
      }

      await Ownership.initialize(botOwnerId, discordOwnerId);

      // 2️⃣ Weryfikacja integralności po inicjalizacji
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