// File path: src/commands/alliance/accept.ts
/**
 * ============================================
 * COMMAND: Accept / Approve
 * FILE: src/commands/alliance/accept.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * ODPOWIEDZIALNOŚĆ:
 * - Akceptacja zgłoszenia użytkownika do sojuszu
 * - Tylko dla R5 / R4 / leader
 * - Integracja z MembershipModule
 *
 * TODO:
 * - Walidacja uprawnień (R5/R4/leader)
 * - Pobranie zgłoszenia z kolejki join
 * - Przypisanie członka do sojuszu
 *
 * ============================================
 */

import { Command } from "../Command";
import { MembershipModule } from "../../system/alliance/modules/membership/MembershipModule";
import { AllianceService } from "../../system/alliance/AllianceService";
import { RoleModule } from "../../system/alliance/modules/role/RoleModule";
import { BroadcastModule } from "../../system/alliance/modules/broadcast/BroadcastModule";

export const AcceptCommand: Command = {
  name: "accept",
  description: "Akceptuje zgłoszenie użytkownika do sojuszu",
  execute: async (interaction) => {
    const actorId = interaction.user.id;

    // 1️⃣ Pobranie sojuszu dla użytkownika
    const alliance = await AllianceService.getAllianceByLeaderOrOfficer(actorId);
    if (!alliance) {
      await interaction.reply({
        content: "Nie jesteś liderem ani oficerem żadnego sojuszu.",
        ephemeral: true,
      });
      return;
    }

    // 2️⃣ Pobranie zgłoszenia z kolejki
    const joinRequest = MembershipModule.getPendingRequest(alliance.id);
    if (!joinRequest) {
      await interaction.reply({
        content: "Brak zgłoszeń oczekujących na akceptację.",
        ephemeral: true,
      });
      return;
    }

    // 3️⃣ Walidacja uprawnień (R5/R4/Leader)
    const isAuthorized = MembershipModule.canApprove(actorId, alliance.id);
    if (!isAuthorized) {
      await interaction.reply({
        content: "Nie masz uprawnień do akceptacji członków.",
        ephemeral: true,
      });
      return;
    }

    // 4️⃣ Dodanie członka do sojuszu
    await MembershipModule.acceptMember(joinRequest.userId, alliance.id);

    // 5️⃣ Nadanie ról Discord
    await RoleModule.assignRole(joinRequest.member, alliance.roles.r3RoleId);

    // 6️⃣ Powiadomienie
    await BroadcastModule.broadcast(
      alliance.id,
      `Użytkownik <@${joinRequest.userId}> został zaakceptowany do sojuszu ${alliance.tag}!`
    );

    // 7️⃣ Odpowiedź dla osoby wykonującej komendę
    await interaction.reply({
      content: `Akceptowano użytkownika <@${joinRequest.userId}> do sojuszu ${alliance.tag}.`,
      ephemeral: true,
    });
  },
};