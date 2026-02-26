// File path: src/commands/sys/allianceDelete.ts
/**
 * ============================================
 * COMMAND: Alliance Delete
 * FILE: src/commands/sys/allianceDelete.ts
 * LAYER: SYSTEM
 * ============================================
 *
 * RESPONSIBILITY:
 * - Deletes an existing alliance from the server
 * - Shadow Authority only (defined in Ownership.ts)
 * - Removes all associated roles and channels via ChannelModule
 * - Integrates with AllianceManager and MutationGate
 *
 * NOTES:
 * - Can delete by unique tag, unique name, or both
 * - Validates guild context
 * - Atomic operation via MutationGate (global lock)
 * - No archive/backup logic implemented
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { Ownership } from "../../system/Ownership/Ownership";
import { MutationGate } from "../../engine/MutationGate";
import { AllianceManager } from "../../system/alliance/AllianceManager";

export const AllianceDeleteCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("alliance_delete")
    .setDescription("Delete an existing alliance (Shadow Authority Only)")
    .addStringOption(option =>
      option
        .setName("tag")
        .setDescription("3-character tag of the alliance to delete")
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName("name")
        .setDescription("Full name of the alliance to delete")
        .setRequired(false)
    ),
  ownerOnly: true,
  systemLayer: true,

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    // 1️⃣ Must be executed inside a guild
    if (!interaction.guild) {
      await interaction.reply({
        content: "❌ Cannot delete alliance outside a guild.",
        ephemeral: true
      });
      return;
    }

    // 2️⃣ Shadow Authority check (single source of truth)
    if (!Ownership.isAuthority(userId)) {
      await interaction.reply({
        content: "⛔ You cannot use this command, you do not have permission.",
        ephemeral: true
      });
      return;
    }

    const tagInput = interaction.options.getString("tag")?.toUpperCase();
    const nameInput = interaction.options.getString("name");

    // 3️⃣ Must provide at least one identifier
    if (!tagInput && !nameInput) {
      await interaction.reply({
        content: "❌ You must provide either the alliance tag or the alliance name to delete.",
        ephemeral: true
      });
      return;
    }

    // 4️⃣ Resolve alliance (tag has priority if both provided)
    let alliance = tagInput
      ? AllianceManager.getAllianceByTag(tagInput, interaction.guild.id)
      : undefined;

    if (!alliance && nameInput) {
      alliance = AllianceManager.getAllianceByName(nameInput, interaction.guild.id);
    }

    if (!alliance) {
      await interaction.reply({
        content: `❌ Alliance not found with the provided ${tagInput ? "tag" : "name"}.`,
        ephemeral: true
      });
      return;
    }

    try {
      // 5️⃣ Atomic deletion (global lock)
      await MutationGate.execute(
        {
          operation: "ALLIANCE_DELETE",
          actor: userId,
          requireGlobalLock: true
        },
        async () => {
          // Delete roles and channels via ChannelModule
          await AllianceManager.deleteAllianceInfrastructure(
            alliance!.id,
            interaction.guild!
          );

          // Remove domain object
          AllianceManager.deleteAlliance(alliance!.id);
        }
      );

      // 6️⃣ Success response
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