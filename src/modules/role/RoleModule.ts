import { MutationGate, MutationOptions } from '../../engine/MutationGate';

export class RoleModule {
    static assignMemberRoles(memberId: string, allianceId: string, actorId?: string) {
        const options: MutationOptions = { actorId };
        MutationGate.execute('ASSIGN_MEMBER_ROLES', allianceId, memberId, options);
    }

    static assignLeaderRole(memberId: string, allianceId: string, actorId?: string) {
        const options: MutationOptions = { actorId };
        MutationGate.execute('ASSIGN_LEADER_ROLE', allianceId, memberId, options);
    }
}