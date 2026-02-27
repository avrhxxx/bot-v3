import { AllianceOrkiestror } from '../../orkiestror/AllianceOrkiestror';
import { MutationGate } from '../../engine/MutationGate';

export class TransferLeaderModule {
  static async transferLeader(allianceId: string, newLeaderId: string) {
    console.log(`[TransferLeaderModule] transferring leader of ${allianceId} to ${newLeaderId}`);

    await MutationGate.execute('TRANSFER_LEADER', { allianceId, newLeaderId });

    await AllianceOrkiestror.transferLeader(allianceId, newLeaderId);

    console.log(`[TransferLeaderModule] leader transferred: ${newLeaderId} in ${allianceId}`);
  }
}