import { AllianceOrkiestror } from '../../orkiestror/AllianceOrkiestror';

export class RulesModule {
    static validateJoin(memberId: string, allianceId: string) {
        const alliance = AllianceOrkiestror.findAlliance(allianceId);
        if (!alliance) throw new Error(`[RulesModule] Alliance ${allianceId} does not exist`);

        if (alliance.members.includes(memberId)) {
            throw new Error(`[RulesModule] Member ${memberId} is already in alliance ${allianceId}`);
        }

        return true;
    }

    static validateLeaderChange(newLeaderId: string, allianceId: string) {
        const alliance = AllianceOrkiestror.findAlliance(allianceId);
        if (!alliance) throw new Error(`[RulesModule] Alliance ${allianceId} does not exist`);

        if (!alliance.members.includes(newLeaderId)) {
            throw new Error(`[RulesModule] Member ${newLeaderId} is not part of alliance ${allianceId}`);
        }

        return true;
    }
}