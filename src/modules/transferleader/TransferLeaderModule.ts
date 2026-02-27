// src/modules/transferleader/TransferLeaderModule.ts

import { AllianceOrkiestror } from '../../orkiestror/AllianceOrkiestror';
import { MutationGate } from '../../engine/MutationGate';

export class TransferLeaderModule {
    static async transferLeader(allianceId: string, newLeaderId: string) {
        // Pobranie sojuszu wg nowej metody
        const alliance = AllianceOrkiestror.findAlliance(allianceId);
        if (!alliance) {
            throw new Error(`[TransferLeaderModule] Alliance ${allianceId} does not exist`);
        }

        // Wykonanie mutacji wg nowego API (2 argumenty)
        await MutationGate.execute('TRANSFER_LEADER', { allianceId, newLeaderId });

        console.log(`[TransferLeaderModule] Leader of alliance ${allianceId} is now ${newLeaderId}`);
    }
}