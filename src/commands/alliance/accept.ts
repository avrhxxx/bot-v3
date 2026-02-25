// File path: src/commands/alliance/accept.ts
/**
 * ============================================
 * COMMAND: Accept / Approve
 * FILE: src/commands/alliance/accept.ts
 * LAYER: COMMAND (Alliance)
 * ============================================
 *
 * RESPONSIBILITY:
 * - Accept a user's request to join the alliance
 * - Only R5 / R4 / leader can approve
 * - Integrates with MembershipModule
 *
 * NOTES:
 * - Checks the leader/officer permissions
 * - Fetches pending join request
 * - Assigns the user to the alliance
 * - Updates Discord roles
 * - Broadcasts acceptance to the alliance
 *
 * ============================================
 */

import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "../Command";
import { MembershipModule } from "../../system/alliance/modules/membership/MembershipModule";
import { AllianceService } from "../../system/alliance/AllianceService";
import { RoleModule } from "../../system/alliance/modules/role/RoleModule";
import { BroadcastModule } from "../../system/alliance/modules/broadcast/BroadcastModule";

export const AcceptCommand: Command = {
  name: "accept",
  description: "Accepts a user's request to join the alliance",
  execute: async (interaction: ChatInputCommandInteraction) => {
    const actorId = interaction.user.id;

    // 1️⃣ Get the alliance for the user (leader/officer)
    const alliance = await AllianceService.getAllianceByLeaderOrOfficer(actorId);
    if (!alliance) {
      await interaction.reply({
        content: "❌ You are not a leader or officer of any alliance.",
        ephemeral: true,
      });
      return;
    }

    // 2️⃣ Get the pending join request
    const joinRequest = await MembershipModule.getPendingRequest(alliance.id);
    if (!joinRequest) {
      await interaction.reply({
        content: "❌ No pending join requests to approve.",
        ephemeral: true,
      });
      return;
    }

    // 3️⃣ Check permissions (R5 / R4 / Leader)
    const isAuthorized = await MembershipModule.canApprove(actorId, alliance.id);
    if (!isAuthorized) {
      await interaction.reply({
        content: "❌ You do not have permission to approve members.",
        ephemeral: true,
      });
      return;
    }

    // 4️⃣ Add the member to the alliance
    await MembershipModule.acceptMember(joinRequest.userId, alliance.id);

    // 5️⃣ Assign Discord roles
    if (joinRequest.member) {
      await RoleModule.assignRole(joinRequest.member, alliance.roles.r3RoleId);
    }

    // 6️⃣ Broadcast the acceptance to the alliance
    await BroadcastModule.broadcast(
      alliance.id,
      `✅ User <@${joinRequest.userId}> has been accepted into alliance ${alliance.tag}!`
    );

    // 7️⃣ Reply to the actor
    await interaction.reply({
      content: `✅ You have accepted <@${joinRequest.userId}> into the alliance ${alliance.tag}.`,
      ephemeral: true,
    });
  },
};

export default AcceptCommand;