import { AllianceOrkiestror } from "./orkiestror/AllianceOrkiestror";
import { MutationGate } from "./engine/MutationGate";

async function main() {
    console.log("[Bootstrap] Starting bot...");

    // Inicjalizacja MutationGate (do atomowych operacji)
    const mutationGate = new MutationGate();

    // Inicjalizacja Orkiestrora (koordynator akcji)
    const allianceOrkiestror = new AllianceOrkiestror(mutationGate);

    console.log("[Bootstrap] Bot initialized and ready.");

    // Tu będzie start Discord klienta i rejestracja komend
}

main().catch(err => {
    console.error("[Bootstrap] Fatal error:", err);
});