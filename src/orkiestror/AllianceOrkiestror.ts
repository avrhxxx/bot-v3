export class AllianceOrkiestror {
    private static alliances: Record<string, any> = {};

    // metoda do pobierania istniejącej lub null
    static getAlliance(allianceId: string) {
        return this.alliances[allianceId] || null;
    }

    // metoda do tworzenia/alliance jeśli nie istnieje
    static createAlliance(allianceId: string) {
        if (!this.alliances[allianceId]) {
            this.alliances[allianceId] = { id: allianceId, members: [] };
        }
        return this.alliances[allianceId];
    }
}