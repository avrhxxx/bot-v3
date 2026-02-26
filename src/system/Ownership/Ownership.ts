// File path: src/commands/sys/allianceDelete.ts
/**
 * ============================================
 * COMMAND: Alliance Delete
 * FILE: src/commands/sys/allianceDelete.ts
 * LAYER: SYSTEM
 * ============================================
 *
 * RESPONSIBILITY:
 * - Deletes an existing alliance
 * - Only Shadow Authority can execute
 * - Integrates with AllianceSystem and MutationGate
 *
 * NOTES:
 * - Can delete by either unique tag or unique alliance name
 * - No backup/archiving implemented yet
 * - System layer and owner-only command
 *
 * ============================================
 */

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
  ownerOnly: true, // system-level owner-only command
  systemLayer: true,

  async execute(interaction: ChatInputCommandInteraction) {
    const userId: string = interaction.user.id;

    // 1️⃣ Sprawdzenie, czy komenda jest używana w guildzie
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot delete alliance outside a guild.", ephemeral: true });
      return;
    }

    // 2️⃣ Sprawdzenie uprawnień Shadow Authority
    if (!Ownership.isAuthority(userId)) {
      await interaction.reply({
        content: "⛔ Only Shadow Authority can execute this command.",
        ephemeral: true
      });
      return;
    }

    // 3️⃣ Pobranie parametrów tag i name
    const tagInput: string | undefined = interaction.options.getString("tag")?.toUpperCase();
    const nameInput: string | undefined = interaction.options.getString("name");

    if (!tagInput && !nameInput) {
      await interaction.reply({
        content: "❌ You must provide either the alliance tag or the alliance name to delete.",
        ephemeral: true
      });
      return;
    }

    // 4️⃣ Znalezienie sojuszu w repo
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
      // 5️⃣ Usunięcie infrastruktury sojuszu atomowo przez MutationGate
      await MutationGate.execute(
        { operation: "ALLIANCE_DELETE", actor: userId, requireGlobalLock: true },
        async () => {
          await AllianceSystem.deleteInfrastructure(alliance!);
          AllianceRepo.delete(alliance!.id);
        }
      );

      // 6️⃣ Potwierdzenie usunięcia
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