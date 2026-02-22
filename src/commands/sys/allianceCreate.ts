// File path: src/commands/sys/allianceCreate.ts

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
    const leaderUser = interaction.options.getUser("leader", true);

    if (!/^[A-Z0-9]{3}$/.test(tag)) {
      await interaction.reply({
        content: "❌ Alliance tag must be exactly 3 characters: letters (A-Z) or numbers (0-9) only.",
        ephemeral: true
      });
      return;
    }

    if (AllianceRepo.getByTag(tag)) {
      await interaction.reply({
        content: `❌ Alliance tag \`${tag}\` already exists. Please choose a different tag.`,
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
          const infra = await AllianceSystem.createInfrastructure({
            guild: interaction.guild!,
            tag,
            leaderId: leaderUser.id
          });

          AllianceRepo.set({
            id: domainId,
            guildId: interaction.guild!.id,
            tag,
            name: `Alliance ${tag}`,
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
        content: `✅ Alliance created successfully with tag \`${tag}\`.\n` +
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