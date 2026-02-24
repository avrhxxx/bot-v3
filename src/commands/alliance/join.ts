// File path: src/commands/alliance/join.ts
/**
 * ============================================
 * COMMAND: Join
 * FILE: src/commands/alliance/join.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Umożliwia użytkownikowi zgłoszenie chęci dołączenia do sojuszu
 * - Dodaje użytkownika do kolejki w MembershipModule
 * - Powiadamia R5 / R4 / leader o nowym zgłoszeniu
 *
 * UWAGA:
 * - Sprawdza, czy użytkownik nie należy już do sojuszu
 * - Sprawdza limity członków sojuszu
 * - Powiadomienie dla użytkownika wysyłane w DM
 *
 * ============================================
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../Command";
import { MembershipModule } from "../../system/alliance/modules/membership/MembershipModule";
import { AllianceService } from "../../system/alliance/AllianceService";
import { SafeMode } from "../../system/SafeMode";

export const JoinCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Zgłoszenie chęci dołączenia do sojuszu"),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Nie można dołączyć poza serwerem.", ephemeral: true });
      return;
    }

    if (SafeMode.isActive()) {
      await interaction.reply({ content: "⛔ System w SAFE_MODE – nie można dołączać do sojuszu.", ephemeral: true });
      return;
    }

    try {
      // Sprawdzenie, czy użytkownik już należy do sojuszu
      const existingAlliance = await AllianceService.getAllianceByMember(userId, interaction.guild.id);
      if (existingAlliance) {
        await interaction.reply({ content: "❌ Już należysz do sojuszu.", ephemeral: true });
        return;
      }

      // Walidacja limitu członków
      const totalMembers = await AllianceService.getTotalMembers(interaction.guild.id);
      if (totalMembers >= 100) {
        await interaction.reply({ content: "❌ Limit członków w sojuszu osiągnięty.", ephemeral: true });
        return;
      }

      // Dodanie zgłoszenia do kolejki
      await MembershipModule.addJoinRequest(userId, interaction.guild.id);

      // Powiadomienie użytkownika
      await interaction.user.send("✅ Twoje zgłoszenie do sojuszu zostało wysłane i oczekuje na akceptację.");

      await interaction.reply({ content: "✅ Zgłoszenie wysłane.", ephemeral: true });
    } catch (error: any) {
      await interaction.reply({ content: `❌ Nie udało się wysłać zgłoszenia: ${error.message}`, ephemeral: true });
    }
  },
};

export default JoinCommand;