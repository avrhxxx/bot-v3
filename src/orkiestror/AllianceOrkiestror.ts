import { MutationGate } from "../engine/MutationGate";

// Orkiestror koordynuje przepływ akcji między modułami
export class AllianceOrkiestror {
    private mutationGate: MutationGate;

    constructor(mutationGate: MutationGate) {
        this.mutationGate = mutationGate;
        console.log("[AllianceOrkiestror] Initialized");
    }

    // placeholder dla przykładowej akcji
    async performAction(actionName: string) {
        console.log(`[AllianceOrkiestror] Performing action: ${actionName}`);
        return this.mutationGate.execute(async () => {
            // tu w przyszłości wywołania modułów (Rules, Membership, Role, Broadcast)
            return `Action ${actionName} executed`;
        });
    }
}