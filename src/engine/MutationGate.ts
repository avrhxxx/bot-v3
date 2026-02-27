// MutationGate odpowiada za atomowe operacje na danych sojuszu
export class MutationGate {
    constructor() {
        console.log("[MutationGate] Initialized");
    }

    // placeholder dla atomowej mutacji
    async execute<T>(operation: () => T): Promise<T> {
        try {
            return await operation();
        } catch (err) {
            console.error("[MutationGate] Operation failed:", err);
            throw err;
        }
    }
}