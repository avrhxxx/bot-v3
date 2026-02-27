import { AllianceOrkiestror } from '../../orkiestror/AllianceOrkiestror';
import { MutationGate, MutationOptions } from '../../engine/MutationGate';

export class TransferLeaderModule {
    static transferLeader(allianceId: string, newLeaderId: string, reason?: string) {
        const alliance = AllianceOrkiestror.findAlliance(allianceId);
        if (!alliance) throw new Error(`[TransferLeaderModule] Alliance ${allianceId} does not exist`);

        // MutationGate oczekuje obiektu typu MutationOptions
        const options: MutationOptions = { /* przypisz tu pola zgodnie z typem MutationOptions */ };
        MutationGate.execute('TRANSFER_LEADER', allianceId, newLeaderId, options);
    }
}