// src/modules/transferleader/TransferLeaderModule.ts

import { AllianceOrkiestror } from '../../orkiestror/AllianceOrkiestror';
import { MutationGate, MutationOptions } from '../../engine/MutationGate';

export class TransferLeaderModule {
    static async transferLeader(allianceId: string, newLeaderId: string) {
        // Pobranie sojuszu
        const alliance = AllianceOrkiestror.getAlliance(allianceId);
        if (!alliance) {
            throw new Error(`[TransferLeaderModule] Alliance ${allianceId} does not exist`);
        }

        // Opcje mutacji
        const options: MutationOptions = {
            reason: 'Leader transfer',
            silent: false
        };

        // Wykonanie mutacji
        await MutationGate.execute('TRANSFER_LEADER', allianceId, newLeaderId, options);

        console.log(`[TransferLeaderModule] Leader of alliance ${allianceId} is now ${newLeaderId}`);
    }
}