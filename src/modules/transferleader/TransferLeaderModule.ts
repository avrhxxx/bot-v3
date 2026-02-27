import { RulesModule } from "../rules/RulesModule";
import { RoleModule } from "../role/RoleModule";
import { BroadcastModule } from "../broadcast/BroadcastModule";
import { AllianceOrkiestror } from "../../../orkiestror/AllianceOrkiestror";
import { MutationGate, MutationOptions } from "../../../engine/MutationGate";

/**
 * Transferuje przywództwo sojuszu w sposób atomowy.
 */
export class TransferLeaderModule {
  static async transferLeader(allianceId: string, newLeaderId: string): Promise<void> {
    const options: MutationOptions = {
      actor: newLeaderId,
      operation: "TRANSFER_LEADER",
      allianceId,
      requireGlobalLock: false,
      requireAllianceLock: true,
    };

    await MutationGate.execute(options, async () => {
      // 1️⃣ Walidacja zmian lidera
      RulesModule.validateLeaderChange(allianceId, newLeaderId);

      // 2️⃣ Aktualizacja lidera w AllianceOrkiestror (Memory + audyt)
      await AllianceOrkiestror.transferLeader(allianceId, newLeaderId);

      // 3️⃣ Aktualizacja ról w Discord
      RoleModule.assignLeaderRole(allianceId, newLeaderId);

      // 4️⃣ Broadcast powiadomień
      BroadcastModule.notifyLeaderChange(allianceId, newLeaderId);
    });
  }
}