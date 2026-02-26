// src/modules/role/RoleModule.ts
export class RoleModule {
  static async assignMemberRoles(allianceId: string, memberId: string) {
    console.log(`[RoleModule] assignMemberRoles ${memberId} in ${allianceId}`);
    return Promise.resolve();
  }
}