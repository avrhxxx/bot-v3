import { MembershipModule } from "../modules/membership/MembershipModule";
import { TransferLeaderModule } from "../modules/transferleader/TransferLeaderModule";

export class AllianceOrkiestror {
  static async addMember(allianceId: string, memberId: string) {
    await MembershipModule.addMember(allianceId, memberId);
  }

  static async transferLeader(allianceId: string, newLeaderId: string) {
    await TransferLeaderModule.transferLeader(allianceId, newLeaderId);
  }
}