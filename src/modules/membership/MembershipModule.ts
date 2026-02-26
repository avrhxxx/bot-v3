// src/modules/membership/MembershipModule.ts
import { RulesModule } from "../rules/RulesModule";
import { BroadcastModule } from "../broadcast/BroadcastModule";
import { RoleModule } from "../role/RoleModule";
import { AllianceService } from "../../AllianceServices";
import { MutationGate, MutationOptions } from "../../engine/MutationGate";

export class MembershipModule {
  /**
   * Dodaje członka do sojuszu w sposób atomowy.
   */
  static async addMember(allianceId: string, memberId: string): Promise<void> {
    const options: MutationOptions = {
      actor: memberId,
      operation: "ADD_MEMBER",
      allianceId,
      requireGlobalLock: false,
      requireAllianceLock: true, // blokada na poziomie sojuszu
    };

    await MutationGate.execute(options, async () => {
      // 1️⃣ Walidacja zasad
      RulesModule.validateJoin(allianceId, memberId);

      // 2️⃣ Dodanie członka w AllianceService (Mongo + audyt)
      await AllianceService.addMember(allianceId, memberId);

      // 3️⃣ Przypisanie ról w Discord
      await RoleModule.assignMemberRoles(allianceId, memberId);

      // 4️⃣ Broadcast powiadomień
      BroadcastModule.notifyJoin(allianceId, memberId);
    });
  }
}