// File path: src/commands/sys/setup.ts

import { ChatInputCommandInteraction } from "discord.js";
import { Ownership } from "../../system/Ownership";
import { SafeMode } from "../../system/SafeMode";

export const SysSetupCommand = {
  name: "setup",
  description: "Bootstrap system ownership (BotOwner Only)",
  ownerOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const userId = interaction.user.id;
      const existingBotOwner = Ownership.getBotOwner();

      if (existingBotOwner && existingBotOwner !== userId) {
        await interaction.reply({
          content: `⛔ Only the BotOwner can run this command.\nCurrent BotOwner: <@${existingBotOwner}>`,
          ephemeral: true
        });
        return;
      }

      const botOwnerId = userId;
      const discordOwnerId = interaction.guild?.ownerId;

      if (!discordOwnerId) {
        await interaction.reply({ content: "❌ Cannot determine Discord server owner.", ephemeral: true });
        return;
      }

      await Ownership.initialize(botOwnerId, discordOwnerId);
      Ownership.enforceInvariant();

      await interaction.reply({
        content: `✅ System initialized successfully.\nBotOwner: <@${botOwnerId}>\nDiscordOwner: <@${discordOwnerId}>`,
        ephemeral: true
      });
    } catch (error: any) {
      console.error("SysSetupCommand error:", error);
      SafeMode.activate("SYS_SETUP_FAILURE");
      await interaction.reply({ content: `❌ Failed to initialize system: ${error.message}`, ephemeral: true });
    }
  }
};

export default SysSetupCommand;