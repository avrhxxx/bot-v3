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
 * - Shadow Authority only (global system control)
 * - Sets both tag and full alliance name
 * - Assigns initial leader (R5)
 * - Creates roles and channels via AllianceSystem
 * - Integrates with MutationGate and AllianceRepo
 *
 * NOTES:
 * - Validates tag (3 characters, letters/numbers, unique per guild)
 * - Validates name (letters + spaces, max 32 characters, unique per guild)
 * - SafeMode usage removed (module no longer exists)
 * - Shadow Authority defined in Ownership.ts (AUTHORITY_IDS from ENV)
 *
 * ============================================
 */

import crypto from "crypto";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { Ownership } from "../../system/Ownership/Ownership";
import { MutationGate } from "../../engine/MutationGate";
import { AllianceSystem } from "../../system/alliance/AllianceSystem";
import { AllianceRepo } from "../../data/Repositories";

export const AllianceCreateCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("alliance_create")
    .setDescription("Create a new alliance (Shadow Authority Only, System Layer)")
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
        .setDescription("User who becomes initial R5 (alliance leader)")
        .setRequired(true)
    ),
  ownerOnly: true,
  systemLayer: true,

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    // 1️⃣ Command must be executed inside a guild
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Cannot create alliance outside a guild.", ephemeral: true });
      return;
    }

    // 2️⃣ Shadow Authority check (defined in Ownership.ts via AUTHORITY_IDS)
    if (!Ownership.isAuthority(userId)) {
      await interaction.reply({
        content: "⛔ Only Shadow Authority can execute this command.",
        ephemeral: true
      });
      return;
    }

    const tag = interaction.options.getString("tag", true).toUpperCase();
    const name = interaction.options.getString("name", true);
    const leaderUser = interaction.options.getUser("leader", true);

    // 3️⃣ Validate tag format (exactly 3 uppercase letters/numbers)
    if (!/^[A-Z0-9]{3}$/.test(tag)) {
      await interaction.reply({
        content: "❌ Alliance tag must be exactly 3 characters: letters (A-Z) or numbers (0-9) only.",
        ephemeral: true
      });
      return;
    }

    // 4️⃣ Validate name format (letters + spaces, max 32 chars)
    if (!/^[A-Za-z\s]{1,32}$/.test(name)) {
      await interaction.reply({
        content: "❌ Alliance name can only contain letters and spaces, max 32 characters.",
        ephemeral: true
      });
      return;
    }

    // 5️⃣ Ensure uniqueness within the guild
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

      type InfraResult = {
        roles: { r5RoleId: string; [key: string]: string };
        channels: { categoryId: string; [key: string]: string };
      };

      // 6️⃣ Atomic infrastructure creation via MutationGate
      const result: InfraResult = await MutationGate.execute(
        {
          operation: "ALLIANCE_CREATE",
          actor: userId,
          requireGlobalLock: true
        },
        async () => {
          // Create Discord roles & channels
          const infra = await AllianceSystem.createInfrastructure({
            guild: interaction.guild!,
            tag,
            leaderId: leaderUser.id
          });

          // Persist domain object in repository
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

      // 7️⃣ Success response
      await interaction.reply({
        content:
          `✅ Alliance created successfully with tag \`${tag}\` and name \`${name}\`.\n` +
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

export default AllianceCreateCommand;