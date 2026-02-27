// src/orkiestror/AllianceOrkiestror.ts
import { RoleModule } from "../modules/role/RoleModule";
import { ChannelModule } from "../modules/channel/ChannelModule";
import { RulesModule } from "../modules/rules/RulesModule";
import { MembershipModule } from "../modules/membership/MembershipModule";
import { TransferLeaderModule } from "../modules/transferleader/TransferLeaderModule";

export class AllianceOrkiestror {
  async setupAllianceStub(guild: any, allianceId: string, tag: string, name: string) {
    console.log("[Orkiestror] setupAllianceStub wywołane");

    await RoleModule.ensureRoles(guild);
    await ChannelModule.createChannels(guild, allianceId, tag, name);
    RulesModule.canPromoteToLeader("stub-member-id");

    await MembershipModule.addMember(allianceId, "stub-member-id");
    await TransferLeaderModule.transferLeader(allianceId, "stub-member-id");

    console.log("[Orkiestror] wszystkie stuby wywołane");
  }
}