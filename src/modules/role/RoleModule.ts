export class RoleModule {
  static async assignMemberRoles(allianceId: string, memberId: string) {
    console.log(`[RoleModule] Assigning roles to ${memberId} in ${allianceId}`);
  }

  static assignLeaderRole(allianceId: string, memberId: string) {
    console.log(`[RoleModule] Assigning leader role to ${memberId} in ${allianceId}`);
  }
}