import { MutationGate, MutationOptions } from '../../engine/MutationGate';

export class MembershipModule {
    static addMember(memberId: string, allianceId: string, actorId?: string) {
        const options: MutationOptions = { actorId };
        MutationGate.execute('ADD_MEMBER', allianceId, memberId, options);
    }
}