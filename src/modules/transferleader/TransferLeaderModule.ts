// src/modules/transferleader/TransferLeaderModule.ts
import { RulesModule } from "../rules/RulesModule";
import { RoleModule } from "../role/RoleModule";
import { BroadcastModule } from "../broadcast/BroadcastModule";
import { AllianceService } from "../../AllianceServices";
import { MutationGate, MutationOptions } from "../../engine/MutationGate";

export class TransferLeaderModule {
  /**
   * Transferuje przywództwo sojuszu w sposób atomowy.
   */
  static async transferLeader(allianceId: string, newLeaderId: string): Promise<void> {
    const options: MutationOptions = {
      actor: newLeaderId,
      operation: "TRANSFER_LEADER",
      allianceId,
      requireGlobalLock: false,
      requireAllianceLock: true, // blokada na poziomie sojuszu
    };

    await MutationGate.execute(options, async () => {
      // 1️⃣ Walidacja zmian lidera
      RulesModule.validateLeaderChange(allianceId, newLeaderId);

      // 2️⃣ Aktualizacja lidera w AllianceService (Mongo + audyt)
      await AllianceService.transferLeader(allianceId, newLeaderId);

      // 3️⃣ Aktualizacja ról w Discord
      RoleModule.assignLeaderRole(allianceId, newLeaderId);

      // 4️⃣ Broadcast powiadomień
      BroadcastModule.notifyLeaderChange(allianceId, newLeaderId);
    });
  }
}