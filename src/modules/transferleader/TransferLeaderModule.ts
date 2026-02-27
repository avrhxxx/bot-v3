// src/modules/transferleader/TransferLeaderModule.ts
export class TransferLeaderModule {
  static async transferLeader(_allianceId: string, _newLeaderId: string) {
    console.log("[Stub] TransferLeaderModule.transferLeader wywołane");
  }

  static async setLeader(_allianceId: string, _leaderId: string) {
    console.log("[Stub] TransferLeaderModule.setLeader wywołane");
  }
}