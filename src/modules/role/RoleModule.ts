import { AllianceService } from "../../AllianceServices";
import { MutationGate } from "../../engine/MutationGate";

export class RoleModule {
  static async assignMemberRoles(allianceId: string, memberId: string) {
    console.log(`[RoleModule] assignMemberRoles: ${memberId} in ${allianceId}`);
  }

  static assignLeaderRole(allianceId: string, memberId: string) {
    console.log(`[RoleModule] assignLeaderRole: ${memberId} in ${allianceId}`);
  }
}