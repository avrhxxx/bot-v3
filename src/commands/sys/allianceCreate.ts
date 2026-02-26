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
 * - Shadow Authority only (system-level permission)
 * - Sets both tag and full alliance name
 * - Does NOT set initial leader (use /set_leader command separately)
 * - Creates roles and channels via AllianceManager
 * - Integrates with MutationGate and AllianceRepo
 *
 * NOTES:
 * - Validates tag (3 characters, letters/numbers, unique per guild)
 * - Validates name (letters + spaces, max 32 characters, unique per guild)
 * - Shadow Authority defined in Ownership.ts (AUTHORITY_IDS from ENV)
 * - Leader assignment must be done afterwards via /set_leader
 *
 * ============================================
 */

import crypto from "crypto";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { Ownership } from "../../system/Ownership/Ownership";
import { MutationGate } from "../../engine/MutationGate";
import { AllianceManager } from "../../system/alliance/AllianceManager";
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

    // 2️⃣ Shadow Authority check
    if (!Ownership.isAuthority(userId)) {
      await interaction.reply({
        content: "⛔ You do not have permission to use this command.",
        ephemeral: true
      });
      return;
    }

    const tag = interaction.options.getString("tag", true).toUpperCase();
    const name = interaction.options.getString("name", true);

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
        roles: { [key: string]: string };
        channels: { [key: string]: string };
      };

      // 6️⃣ Atomic infrastructure creation via MutationGate
      const result: InfraResult = await MutationGate.execute(
        {
          operation: "ALLIANCE_CREATE",
          actor: userId,
          requireGlobalLock: true
        },
        async () => {
          // Create Discord roles & channels via AllianceManager
          const infra = await AllianceManager.createInfrastructure({
            guild: interaction.guild!,
            tag
          });

          // Persist domain object in repository
          AllianceRepo.set({
            id: domainId,
            guildId: interaction.guild!.id,
            tag,
            name,
            members: { r5: [], r4: [], r3: [] }, // leader must be assigned later
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
          `Roles and channels have been initialized. Assign a leader using /set_leader.`,
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