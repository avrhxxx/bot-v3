// src/modules/membership/MembershipModule.ts
import { RulesModule } from "../rules/RulesModule";
import { BroadcastModule } from "../broadcast/BroadcastModule";
import { RoleModule } from "../role/RoleModule";
import { AllianceService } from "../../AllianceService";
import { MutationGate } from "../../engine/MutationGate";

export class MembershipModule {
  static async addMember(allianceId: string, memberId: string) {
    await MutationGate.execute(
      { actor: memberId, operation: "ADD_MEMBER", allianceId },
      async () => {
        // Wywołania stubów
        RulesModule.validateJoin(allianceId, memberId);
        AllianceService.addMember(allianceId, memberId);
        await RoleModule.assignMemberRoles(allianceId, memberId);
        BroadcastModule.notifyJoin(allianceId, memberId);
      }
    );
  }
}