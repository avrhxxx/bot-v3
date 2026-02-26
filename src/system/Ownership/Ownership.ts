// File path: src/commands/sys/allianceDelete.ts
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { Ownership } from "../../system/Ownership/Ownership";
import { MutationGate } from "../../engine/MutationGate";
import { AllianceRepo } from "../../data/Repositories";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";

export const AllianceDeleteCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("alliance_delete")
    .setDescription("Delete an existing alliance (Shadow Authority Only)")
    .addStringOption(option =>
      option.setName("tag")
        .setDescription("3-character tag of the alliance to delete")
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName("name")
        .setDescription("Full name of the alliance to delete")
        .setRequired(false)
    ),
  ownerOnly: true,
  systemLayer: true,

  async execute(interaction: ChatInputCommandInteraction) {
    const userId: string = interaction.user.id;

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot delete alliance outside a guild.", ephemeral: true });
      return;
    }

    // ✅ Shadow Authority check
    if (!Ownership.isAuthority(userId)) {
      await interaction.reply({
        content: "⛔ Only Shadow Authority can execute this command.",
        ephemeral: true
      });
      return;
    }

    const tagInput: string | undefined = interaction.options.getString("tag")?.toUpperCase();
    const nameInput: string | undefined = interaction.options.getString("name");

    if (!tagInput && !nameInput) {
      await interaction.reply({
        content: "❌ You must provide either the alliance tag or the alliance name to delete.",
        ephemeral: true
      });
      return;
    }

    let alliance = tagInput ? AllianceRepo.getByTag(tagInput, interaction.guild.id) : undefined;
    if (!alliance && nameInput) {
      alliance = AllianceRepo.getByName(nameInput, interaction.guild.id);
    }

    if (!alliance) {
      await interaction.reply({
        content: `❌ Alliance not found with the provided ${tagInput ? "tag" : "name"}.`,
        ephemeral: true
      });
      return;
    }

    try {
      await MutationGate.execute(
        { operation: "ALLIANCE_DELETE", actor: userId, requireGlobalLock: true },
        async () => {
          await AllianceSystem.deleteInfrastructure(alliance!);
          AllianceRepo.delete(alliance!.id);
        }
      );

      await interaction.reply({
        content: `✅ Alliance \`${alliance.name}\` (${alliance.tag}) has been deleted successfully.`,
        ephemeral: false
      });
    } catch (error: any) {
      console.error("Alliance deletion error:", error);
      await interaction.reply({
        content: `❌ Failed to delete alliance: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default AllianceDeleteCommand;