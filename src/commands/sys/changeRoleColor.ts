// File path: src/commands/sys/changeRoleColor.ts
/**
 * ============================================
 * FILE: src/commands/sys/changeRoleColor.ts
 * LAYER: COMMAND / SYSTEM
 * ============================================
 *
 * RESPONSIBILITY:
 * - Allows Shadow Authority to change the color of an existing role.
 * - Intended for system-managed roles (e.g., Shadow Authority role).
 *
 * DEPENDENCIES:
 * - discord.js (ChatInputCommandInteraction, Role)
 * - Ownership (authorization via AUTHORITY_IDS from ENV)
 *
 * NOTES:
 * - OwnerModule removed (no longer exists)
 * - Authorization handled via Ownership.isAuthority()
 *
 * ============================================
 */

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  Role
} from "discord.js";

import { Ownership } from "../../system/Ownership/Ownership";

// ----------------- HEX VALIDATION -----------------
/**
 * Validates hex color format (#RRGGBB)
 */
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

  const userId = interaction.user.id;

  // 1️⃣ Must be used inside a guild
  if (!interaction.guild) {
    await interaction.reply({
      content: "❌ This command can only be used inside a guild.",
      ephemeral: true
    });
    return;
  }

  // 2️⃣ Shadow Authority authorization check
  if (!Ownership.isAuthority(userId)) {
    await interaction.reply({
      content: "⛔ Only Shadow Authority can execute this command.",
      ephemeral: true
    });
    return;
  }

  // 3️⃣ Get options
  const role = interaction.options.getRole("role", true) as Role;
  const color = interaction.options.getString("color", true);

  // 4️⃣ Validate hex format
  if (!isValidHexColor(color)) {
    await interaction.reply({
      content: "❌ Invalid hex color. Please provide a color in format #RRGGBB.",
      ephemeral: true
    });
    return;
  }

  // 5️⃣ Change role color
  try {
    await role.setColor(color, `Changed by Shadow Authority ${interaction.user.tag}`);

    await interaction.reply({
      content: `✅ The role ${role.name} color has been changed to ${color}.`
    });

  } catch (error) {
    console.error("Failed to change role color:", error);

    await interaction.reply({
      content: "❌ Failed to change the role color.",
      ephemeral: true
    });
  }
}