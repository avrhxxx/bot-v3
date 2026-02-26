/**
 * ============================================
 * FILE: src/commands/sys/changeRoleColor.ts
 * LAYER: COMMAND / System
 * ============================================
 *
 * RESPONSIBILITY:
 * - Allows authorized users (Shadow Authority) to change the color of an existing role.
 * - Only affects roles that the system manages, e.g., Shadow Authority roles.
 *
 * DEPENDENCIES:
 * - discord.js (Client, CommandInteraction, Permissions, Role)
 * - OwnerModule (authorization)
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionsBitField, Role, Guild } from "discord.js";
import { OwnerModule } from "../../system/OwnerModule/OwnerModule";

// ----------------- HEX VALIDATION -----------------
function isValidHexColor(hex: string): boolean {
  return /^#([0-9A-Fa-f]{6})$/.test(hex);
}

// ----------------- COMMAND DEFINITION -----------------
export const data = new SlashCommandBuilder()
  .setName("changeRoleColor")
  .setDescription("Changes the color of an existing role (Shadow Authority only).")
  .addRoleOption(option =>
    option
      .setName("role")
      .setDescription("The role whose color you want to change")
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName("color")
      .setDescription("New color in hex format (e.g., #8B00FF)")
      .setRequired(true)
  );

// ----------------- COMMAND EXECUTION -----------------
export async function execute(interaction: ChatInputCommandInteraction) {
  // ----------------- CHECK AUTHORIZATION -----------------
  const userId = interaction.user.id;
  if (!OwnerModule.isBotOwner(userId)) {
    await interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    return;
  }

  // ----------------- GET OPTIONS -----------------
  const role = interaction.options.getRole("role", true) as Role;
  const color = interaction.options.getString("color", true);

  // ----------------- VALIDATE HEX -----------------
  if (!isValidHexColor(color)) {
    await interaction.reply({ content: "❌ Invalid hex color. Please provide a color in format #RRGGBB.", ephemeral: true });
    return;
  }

  // ----------------- CHANGE ROLE COLOR -----------------
  try {
    await role.setColor(color, `Changed by Shadow Authority ${interaction.user.tag}`);
    await interaction.reply({ content: `✅ The role ${role.name} color has been changed to ${color}.` });
  } catch (error) {
    console.error("Failed to change role color:", error);
    await interaction.reply({ content: "❌ Failed to change the role color.", ephemeral: true });
  }
}