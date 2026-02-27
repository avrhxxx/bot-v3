import { AllianceOrkiestror } from '../../orkiestror/AllianceOrkiestror';

export class RulesModule {
    static validateJoin(memberId: string, allianceId: string) {
        const alliance = AllianceOrkiestror.getAlliance(allianceId);
        if (!alliance) throw new Error(`[RulesModule] Alliance ${allianceId} does not exist`);
        return true;
    }

    static validateLeaderChange(newLeaderId: string, allianceId: string) {
        const alliance = AllianceOrkiestror.getAlliance(allianceId);
        if (!alliance) throw new Error(`[RulesModule] Alliance ${allianceId} does not exist`);
        return true;
    }
}