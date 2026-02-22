// File path: src/commands/sys/allianceDelete.ts

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { Ownership } from "../../system/Ownership";
import { MutationGate } from "../../engine/MutationGate";
import { AllianceRepo } from "../../data/Repositories";
import { SafeMode } from "../../system/SafeMode";
import { AllianceSystem } from "../../features/alliance/AllianceSystem";

export const Command: Command = {
  data: new SlashCommandBuilder()
    .setName("alliance_delete")
    .setDescription("Delete an existing alliance (Owner Only, System Layer)")
    .addStringOption(option =>
      option
        .setName("tag")
        .setDescription("3-character tag of the alliance to delete")
        .setRequired(true)
    ),
  ownerOnly: true,
  systemLayer: true,

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot delete alliance outside a guild.", ephemeral: true });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System in SAFE_MODE – structural commands blocked.", ephemeral: true });
      return;
    }

    if (!Ownership.isBotOwner(userId) && !Ownership.isDiscordOwner(userId)) {
      await interaction.reply({ content: "⛔ Only Bot Owner or Discord Owner can execute this command.", ephemeral: true });
      return;
    }

    const tag = interaction.options.getString("tag", true).toUpperCase();
    const alliance = AllianceRepo.getByTag(tag);

    if (!alliance) {
      await interaction.reply({ content: `❌ Alliance with tag \`${tag}\` does not exist.`, ephemeral: true });
      return;
    }

    try {
      await MutationGate.execute(
        { operation: "ALLIANCE_DELETE", actor: userId, requireGlobalLock: true },
        async () => {
          await AllianceSystem.deleteInfrastructure(alliance);
          AllianceRepo.delete(alliance.id);
        }
      );

      await interaction.reply({ content: `✅ Alliance with tag \`${tag}\` has been deleted successfully.`, ephemeral: false });
    } catch (error: any) {
      console.error("Alliance deletion error:", error);
      await interaction.reply({ content: `❌ Failed to delete alliance: ${error.message}`, ephemeral: true });
    }
  }
};

export default Command;