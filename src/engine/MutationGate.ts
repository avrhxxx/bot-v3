export interface MutationOptions {
    actorId?: string;
    reason?: string;
    timestamp?: number;
}

export class MutationGate {
    static execute(action: string, allianceId: string, targetId: string, options: MutationOptions) {
        console.log(`[MutationGate] Executing ${action} on ${targetId} in alliance ${allianceId}`, options);
        // tu logika mutacji
    }
}