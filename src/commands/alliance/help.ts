// File path: src/commands/alliance/help.ts
/**
 * ============================================
 * COMMAND: Help
 * FILE: src/commands/alliance/help.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Display detailed help for all alliance commands
 * - Shows command usage, required channel, and role requirements
 * - Paginated embed with 3 commands per page
 *
 * NOTES:
 * - System commands are excluded
 * - Only alliance-related commands are displayed
 * - Uses buttons to navigate pages
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ButtonInteraction } from "discord.js";
import { Command } from "../Command";

interface HelpCommandData {
  name: string;
  description: string;
  usageChannel: string;
  requirements: string;
}

const helpPages: HelpCommandData[][] = [
  [
    { name: "/join", description: "Submit a request to join an alliance.", usageChannel: "#join", requirements: "You must not belong to any alliance." },
    { name: "/accept [user]", description: "Approve a user's request to join the alliance. The user will receive a DM.", usageChannel: "#staff-room", requirements: "You must be R4 or R5 in the alliance." },
    { name: "/deny [user]", description: "Reject a user's request to join the alliance. The user will receive a DM.", usageChannel: "#staff-room", requirements: "You must be R4 or R5 in the alliance." },
  ],
  [
    { name: "/promote [user]", description: "Promote a member to a higher rank in the alliance.", usageChannel: "#staff-room", requirements: "You must be R4 or R5 in the alliance." },
    { name: "/demote [user]", description: "Demote a member to a lower rank in the alliance.", usageChannel: "#staff-room", requirements: "You must be R4 or R5 in the alliance." },
    { name: "/kick [user]", description: "Kick a member from the alliance. A notification is sent in announce channel.", usageChannel: "#staff-room", requirements: "You must be R4 or R5 in the alliance." },
  ],
  [
    { name: "/transfer_leader [user]", description: "Transfer leadership of your alliance to another member.", usageChannel: "#staff-room", requirements: "You must be R5 in the alliance." },
    { name: "/update_tag [tag]", description: "Change your alliance tag (3 characters, letters or numbers).", usageChannel: "#staff-room", requirements: "You must be R5 in the alliance." },
    { name: "/update_name [name]", description: "Change your alliance name (letters and spaces only, max 32 characters).", usageChannel: "#staff-room", requirements: "You must be R5 in the alliance." },
  ]
];

export const HelpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Display detailed help for all alliance commands"),

  async execute(interaction: ChatInputCommandInteraction) {
    let currentPage = 0;

    const generateEmbed = (page: number) => {
      const embed = new EmbedBuilder()
        .setTitle("💠 Alliance Commands – Help")
        .setColor(0x3498db)
        .setFooter({ text: `Page ${page + 1} of ${helpPages.length}` });

      helpPages[page].forEach(cmd => {
        embed.addFields({
          name: cmd.name,
          value: `**Description:** ${cmd.description}\n**Usage channel:** ${cmd.usageChannel}\n**Requirements:** ${cmd.requirements}`
        });
      });

      return embed;
    };

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder().setCustomId("prev").setLabel("⬅️ Previous").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("next").setLabel("Next ➡️").setStyle(ButtonStyle.Primary)
      );

    const message = await interaction.reply({ embeds: [generateEmbed(currentPage)], components: [row], fetchReply: true });

    const collector = message.createMessageComponentCollector({ time: 120000 });

    collector.on("collect", (btnInteraction: ButtonInteraction) => {
      if (!btnInteraction.isButton()) return;

      if (btnInteraction.customId === "prev") {
        currentPage = (currentPage - 1 + helpPages.length) % helpPages.length;
      } else if (btnInteraction.customId === "next") {
        currentPage = (currentPage + 1) % helpPages.length;
      }

      btnInteraction.update({ embeds: [generateEmbed(currentPage)] });
    });

    collector.on("end", () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });
  }
};

export default HelpCommand;