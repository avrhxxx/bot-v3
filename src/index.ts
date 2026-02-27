// Główny plik startowy
import { MutationGate } from './engine/MutationGate';
import { AllianceOrkiestror } from './orkiestror/AllianceOrkiestror';

async function main() {
    console.log('Bot minimalny: start');

    // Przykład użycia klas – nic nie robią jeszcze
    const orkiestror = new AllianceOrkiestror();
    const mutationGate = new MutationGate();

    console.log('Instancje utworzone:', { orkiestror, mutationGate });

    // Tu w przyszłości możesz bootstrapować sojusze itp.
}

main().catch(console.error);