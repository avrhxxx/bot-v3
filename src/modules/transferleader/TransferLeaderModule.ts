import { AllianceOrkiestror } from '../../orkiestror/AllianceOrkiestror';
import { MutationGate } from '../../engine/MutationGate';

export class TransferLeaderModule {
  static async transferLeader(allianceId: string, newLeaderId: string) {
    console.log(`[TransferLeaderModule] transferring leader of ${allianceId} to ${newLeaderId}`);

    // Poprawiony wywołanie: MutationOptions
    await MutationGate.execute({
      type: 'TRANSFER_LEADER',
      payload: { allianceId, newLeaderId }
    });

    await AllianceOrkiestror.transferLeader(allianceId, newLeaderId);

    console.log(`[TransferLeaderModule] leader transferred: ${newLeaderId} in ${allianceId}`);
  }
}