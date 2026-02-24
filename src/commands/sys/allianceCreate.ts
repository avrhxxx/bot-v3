// File path: src/commands/sys/allianceCreate.ts
/**
 * ============================================
 * COMMAND: Alliance Create
 * FILE: src/commands/sys/allianceCreate.ts
 * LAYER: SYSTEM
 * ============================================
 *
 * RESPONSIBILITY:
 * - Create a new alliance
 * - Owner-only and system-layer command
 * - Sets both tag and full alliance name
 * - Assigns initial leader (R5)
 * - Creates roles and channels via AllianceSystem
 * - Integrates with MutationGate and AllianceRepo
 *
 * NOTES:
 * - Validates tag (3 characters, letters/numbers, unique per guild)
 * - Validates name (letters + spaces, max 32 characters, unique per guild)
 * - Only Bot Owner or Discord Owner can execute
 * - SafeMode prevents execution
 *
 * ============================================
 */

import crypto from "crypto";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { Ownership } from "../../system/Ownership";
import { MutationGate } from "../../engine/MutationGate";
import { AllianceSystem } from "../../features/alliance/AllianceSystem";
import { AllianceRepo } from "../../data/Repositories";
import { SafeMode } from "../../system/SafeMode";

export const Command: Command = {
  data: new SlashCommandBuilder()
    .setName("alliance_create")
    .setDescription("Create a new alliance (Owner Only, System Layer)")
    .addStringOption(option =>
      option
        .setName("tag")
        .setDescription("3-character unique alliance tag (letters and numbers only)")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("name")
        .setDescription("Full alliance name (letters and spaces only, max 32 characters)")
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName("leader")
        .setDescription("User ID of the alliance leader")
        .setRequired(true)
    ),
  ownerOnly: true,
  systemLayer: true,

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot create alliance outside a guild.", ephemeral: true });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({
        content: "⛔ System in SAFE_MODE – structural commands blocked.",
        ephemeral: true
      });
      return;
    }

    if (!Ownership.isBotOwner(userId) && !Ownership.isDiscordOwner(userId)) {
      await interaction.reply({
        content: "⛔ Only Bot Owner or Discord Owner can execute this command.",
        ephemeral: true
      });
      return;
    }

    const tag = interaction.options.getString("tag", true).toUpperCase();
    const name = interaction.options.getString("name", true);
    const leaderUser = interaction.options.getUser("leader", true);

    // 1️⃣ Validate tag (3 chars, letters/numbers)
    if (!/^[A-Z0-9]{3}$/.test(tag)) {
      await interaction.reply({
        content: "❌ Alliance tag must be exactly 3 characters: letters (A-Z) or numbers (0-9) only.",
        ephemeral: true
      });
      return;
    }

    // 2️⃣ Validate name (letters + spaces, max 32)
    if (!/^[A-Za-z\s]{1,32}$/.test(name)) {
      await interaction.reply({
        content: "❌ Alliance name can only contain letters and spaces, max 32 characters.",
        ephemeral: true
      });
      return;
    }

    // 3️⃣ Check uniqueness within the guild
    if (AllianceRepo.getByTag(tag, interaction.guild.id)) {
      await interaction.reply({
        content: `❌ Alliance tag \`${tag}\` already exists. Please choose a different tag.`,
        ephemeral: true
      });
      return;
    }

    if (AllianceRepo.getByName(name, interaction.guild.id)) {
      await interaction.reply({
        content: `❌ Alliance name \`${name}\` already exists. Please choose a different name.`,
        ephemeral: true
      });
      return;
    }

    try {
      const domainId = crypto.randomUUID();

      const result = await MutationGate.execute(
        {
          operation: "ALLIANCE_CREATE",
          actor: userId,
          requireGlobalLock: true
        },
        async () => {
          // Create roles/channels infrastructure
          const infra = await AllianceSystem.createInfrastructure({
            guild: interaction.guild!,
            tag,
            leaderId: leaderUser.id
          });

          // Save alliance to repo
          AllianceRepo.set({
            id: domainId,
            guildId: interaction.guild!.id,
            tag,
            name,
            members: { r5: leaderUser.id, r4: [], r3: [] },
            roles: infra.roles,
            channels: infra.channels,
            orphaned: false,
            createdAt: Date.now()
          });

          return infra;
        }
      );

      await interaction.reply({
        content: `✅ Alliance created successfully with tag \`${tag}\` and name \`${name}\`.\n` +
                 `R5 Role ID: ${result.roles.r5RoleId}\n` +
                 `Category ID: ${result.channels.categoryId}`,
        ephemeral: false
      });

    } catch (error: any) {
      console.error("Alliance creation error:", error);
      await interaction.reply({
        content: `❌ Failed to create alliance: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

export default Command;