// src/modules/transferleader/TransferLeaderModule.ts

import { AllianceOrkiestror } from '../../../orkiestror/AllianceOrkiestror';
import { MutationGate, MutationOptions } from '../../../engine/MutationGate';

export class TransferLeaderModule {
  static async transferLeader(allianceId: string, newLeaderId: string) {
    // Pobierz sojusz
    const alliance = AllianceOrkiestror.getAlliance(allianceId);
    if (!alliance) {
      throw new Error(`[TransferLeaderModule] Alliance ${allianceId} does not exist`);
    }

    // Przygotuj opcje mutacji
    const options: MutationOptions = {
      allianceId,
      memberId: newLeaderId,
    };

    // Wykonaj mutację zmiany lidera
    await MutationGate.execute('TRANSFER_LEADER', options);

    console.log(`[TransferLeaderModule] Leader of ${allianceId} changed to ${newLeaderId}`);
  }
}