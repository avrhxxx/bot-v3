import { AllianceOrkiestror } from '../../orkiestror/AllianceOrkiestror';
import { MutationGate, MutationOptions } from '../../engine/MutationGate';

export class TransferLeaderModule {
    static transferLeader(allianceId: string, newLeaderId: string, actorId?: string, reason?: string) {
        const alliance = AllianceOrkiestror.getAlliance(allianceId);
        if (!alliance) throw new Error(`[TransferLeaderModule] Alliance ${allianceId} does not exist`);

        const options: MutationOptions = { actorId, reason };
        MutationGate.execute('TRANSFER_LEADER', allianceId, newLeaderId, options);
        alliance.leaderId = newLeaderId;
    }
}