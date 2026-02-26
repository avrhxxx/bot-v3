import { RulesModule } from "../rules/RulesModule";
import { RoleModule } from "../role/RoleModule";
import { BroadcastModule } from "../broadcast/BroadcastModule";
import { AllianceService } from "../../AllianceService";
import { MutationGate } from "../../engine/MutationGate";

export class TransferLeaderModule {
  static async transferLeader(allianceId: string, newLeaderId: string) {
    await MutationGate.execute({ actor: newLeaderId, operation: 'TRANSFER_LEADER', allianceId }, async () => {
      RulesModule.validateLeaderChange(allianceId, newLeaderId);
      AllianceService.getAlliance(allianceId); // stub
      RoleModule.assignLeaderRole(allianceId, newLeaderId);
      BroadcastModule.notifyLeaderChange(allianceId, newLeaderId);
    });
  }
}