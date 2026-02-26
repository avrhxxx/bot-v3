// src/modules/role/RoleModule.ts
import { AllianceService } from "../../AllianceServices";
import { MutationGate, MutationOptions } from "../../engine/MutationGate";

export class RoleModule {
  /**
   * Przypisuje podstawowe role członkowskie (R3/R4/R5) w sojuszu.
   */
  static async assignMemberRoles(allianceId: string, memberId: string): Promise<void> {
    const options: MutationOptions = {
      actor: memberId,
      operation: "ASSIGN_MEMBER_ROLES",
      allianceId,
      requireAllianceLock: true,
    };

    await MutationGate.execute(options, async () => {
      // pobieramy sojusz z bazy
      const alliance = await AllianceService.getAlliance(allianceId);
      if (!alliance) throw new Error(`Sojusz ${allianceId} nie istnieje`);

      // logika przypisania ról (przykładowa, można rozbudować)
      console.log(`[RoleModule] assignMemberRoles: ${memberId} in ${allianceId}`);
      // tu np. aktualizacja pola "roles" w Mongo lub wywołanie Discord API
    });
  }

  /**
   * Przypisuje rolę lidera w sojuszu
   */
  static async assignLeaderRole(allianceId: string, memberId: string): Promise<void> {
    const options: MutationOptions = {
      actor: memberId,
      operation: "ASSIGN_LEADER_ROLE",
      allianceId,
      requireAllianceLock: true,
    };

    await MutationGate.execute(options, async () => {
      const alliance = await AllianceService.getAlliance(allianceId);
      if (!alliance) throw new Error(`Sojusz ${allianceId} nie istnieje`);

      console.log(`[RoleModule] assignLeaderRole: ${memberId} in ${allianceId}`);
      // tu można też np. aktualizować role w Discord
    });
  }
}