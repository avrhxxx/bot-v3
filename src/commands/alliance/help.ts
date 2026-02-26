// File path: src/commands/alliance/help.ts
/**
 * ============================================
 * COMMAND: Help (Extended)
 * FILE: src/commands/alliance/help.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Provides detailed help for all alliance commands
 * - Shows paginated embeds with 3 commands per page
 * - Includes emoji, description, example usage, channel, and role requirements
 *
 * NOTES:
 * - Only alliance commands are displayed
 * - System/internal commands are hidden
 * - Only displays commands user has access to
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType } from "discord.js";
import { Command } from "../Command";

export const HelpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Display detailed help for all alliance commands"),

  async execute(interaction: ChatInputCommandInteraction) {
    const pages = [];

    // ----------------- Page 1 -----------------
    pages.push(new EmbedBuilder()
      .setTitle("🏰 Alliance Commands Help (Page 1)")
      .setColor("Blue")
      .addFields(
        {
          name: "👋 /join",
          value: "**Description:** Submit a request to join an alliance\n**Usage Requirements:** Only if you do not belong to any alliance\n**Use in:** #join\n**Example:** `/join`",
        },
        {
          name: "✅ /accept",
          value: "**Description:** Approve a user's request to join the alliance\n**Usage Requirements:** Only R4/R5 or Leader\n**Use in:** #staff-room\n**Example:** `/accept user:@username`",
        },
        {
          name: "❌ /deny",
          value: "**Description:** Reject a user's request to join the alliance\n**Usage Requirements:** Only R4/R5 or Leader\n**Use in:** #staff-room\n**Example:** `/deny member:@username`",
        }
      )
      .setFooter({ text: "Page 1 of 3" })
    );

    // ----------------- Page 2 -----------------
    pages.push(new EmbedBuilder()
      .setTitle("🏰 Alliance Commands Help (Page 2)")
      .setColor("Blue")
      .addFields(
        {
          name: "⬆️ /promote",
          value: "**Description:** Promote a member to the next rank\n**Usage Requirements:** Only R5\n**Use in:** #staff-room\n**Example:** `/promote member:@username`",
        },
        {
          name: "⬇️ /demote",
          value: "**Description:** Demote a member to a lower rank\n**Usage Requirements:** Only R5\n**Use in:** #staff-room\n**Example:** `/demote member:@username`",
        },
        {
          name: "🪑 /kick",
          value: "**Description:** Kick a member from the alliance\n**Usage Requirements:** Only R5\n**Use in:** #staff-room\n**Example:** `/kick member:@username`",
        }
      )
      .setFooter({ text: "Page 2 of 3" })
    );

    // ----------------- Page 3 -----------------
    pages.push(new EmbedBuilder()
      .setTitle("🏰 Alliance Commands Help (Page 3)")
      .setColor("Blue")
      .addFields(
        {
          name: "🎤 /broadcast",
          value: "**Description:** Send a message to all alliance members\n**Usage Requirements:** Only R5/R4\n**Use in:** #staff-room\n**Example:** `/broadcast message:Hello team!`",
        },
        {
          name: "👑 /transfer_leader",
          value: "**Description:** Transfer leadership to another member\n**Usage Requirements:** Only R5\n**Use in:** #staff-room\n**Example:** `/transfer_leader new_leader:@username`",
        },
        {
          name: "📝 /update_name",
          value: "**Description:** Change the alliance name\n**Usage Requirements:** Only R5\n**Use in:** #staff-room\n**Example:** `/update_name name:New Alliance Name`",
        },
        {
          name: "🏷️ /update_tag",
          value: "**Description:** Change the alliance tag\n**Usage Requirements:** Only R5\n**Use in:** #staff-room\n**Example:** `/update_tag tag:ABC`",
        }
      )
      .setFooter({ text: "Page 3 of 3" })
    );

    // ----------------- Buttons -----------------
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("⬅️ Previous")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next ➡️")
          .setStyle(ButtonStyle.Primary)
      );

    let currentPage = 0;

    const message = await interaction.reply({
      embeds: [pages[currentPage]],
      components: [row],
      fetchReply: true,
      ephemeral: true
    });

    // ----------------- Collector -----------------
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000 // 2 minutes
    });

    collector.on("collect", async (btnInteraction) => {
      if (btnInteraction.user.id !== interaction.user.id) {
        await btnInteraction.reply({ content: "⛔ You cannot interact with this.", ephemeral: true });
        return;
      }

      if (btnInteraction.customId === "prev") {
        currentPage = (currentPage === 0) ? pages.length - 1 : currentPage - 1;
      } else if (btnInteraction.customId === "next") {
        currentPage = (currentPage === pages.length - 1) ? 0 : currentPage + 1;
      }

      await btnInteraction.update({ embeds: [pages[currentPage]] });
    });

    collector.on("end", async () => {
      // Disable buttons after expiration
      const disabledRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder().setCustomId("prev").setLabel("⬅️ Previous").setStyle(ButtonStyle.Primary).setDisabled(true),
          new ButtonBuilder().setCustomId("next").setLabel("Next ➡️").setStyle(ButtonStyle.Primary).setDisabled(true)
        );
      await interaction.editReply({ components: [disabledRow] });
    });
  }
};

export default HelpCommand;