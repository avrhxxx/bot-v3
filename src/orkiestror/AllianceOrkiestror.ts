export interface Alliance {
    id: string;
    members: string[];
    leaderId?: string;
}

export class AllianceOrkiestror {
    private static alliances: Record<string, Alliance> = {};

    static getAlliance(allianceId: string): Alliance | null {
        return this.alliances[allianceId] || null;
    }

    static createAlliance(allianceId: string): Alliance {
        if (!this.alliances[allianceId]) {
            this.alliances[allianceId] = { id: allianceId, members: [] };
        }
        return this.alliances[allianceId];
    }
}