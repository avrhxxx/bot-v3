import { AllianceOrkiestror } from '../../orkiestror/AllianceOrkiestror';
import { MutationGate, MutationOptions } from '../../engine/MutationGate';

export class TransferLeaderModule {
    static transferLeader(allianceId: string, newLeaderId: string, reason?: string) {
        const alliance = AllianceOrkiestror.getAlliance(allianceId);
        if (!alliance) throw new Error(`[TransferLeaderModule] Alliance ${allianceId} does not exist`);

        const options: MutationOptions = { reason };
        MutationGate.execute('TRANSFER_LEADER', allianceId, newLeaderId, options);
    }
}