// src/orkiestror/AllianceOrkiestror.ts
import { RoleModule } from "../modules/role/RoleModule";
import { ChannelModule } from "../modules/channel/ChannelModule";
import { RulesModule } from "../modules/rules/RulesModule";
import { MembershipModule } from "../modules/membership/MembershipModule";
import { TransferLeaderModule } from "../modules/transferleader/TransferLeaderModule";

export class AllianceOrkiestror {
  async setupAllianceStub(guild: any, allianceId: string, tag: string, name: string) {
    console.log("[Orkiestror] setupAllianceStub wywołane");

    // --------------------------
    // 1️⃣ Tworzymy role dla stubowego sojuszu
    // --------------------------
    await RoleModule.createRoles(guild, tag, name);

    // --------------------------
    // 2️⃣ Tworzymy szkielet kanałów
    // --------------------------
    await ChannelModule.createChannels(guild, allianceId, tag, name);

    // --------------------------
    // 3️⃣ Stubowe walidacje i członkostwo
    // --------------------------
    RulesModule.canPromoteToLeader("stub-member-id");
    await MembershipModule.addMember(allianceId, "stub-member-id");
    await TransferLeaderModule.transferLeader(allianceId, "stub-member-id");

    console.log("[Orkiestror] wszystkie stuby wywołane");
  }
}