// src/modules/membership/MembershipModule.ts
export class MembershipModule {
  static async addMember(_allianceId: string, _memberId: string) {
    console.log("[Stub] MembershipModule.addMember wywołane");
  }

  static async removeMember(_allianceId: string, _memberId: string) {
    console.log("[Stub] MembershipModule.removeMember wywołane");
  }

  static async promoteMember(_allianceId: string, _memberId: string) {
    console.log("[Stub] MembershipModule.promoteMember wywołane");
  }

  static async demoteMember(_allianceId: string, _memberId: string) {
    console.log("[Stub] MembershipModule.demoteMember wywołane");
  }
}