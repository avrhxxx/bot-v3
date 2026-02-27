import { AllianceOrkiestror } from '../../orkiestror/AllianceOrkiestror';

export class RulesModule {
  static validateJoin(allianceId: string, memberId: string) {
    // Memory-mode automatycznie tworzy sojusz, więc nie sprawdzamy getAlliance
    console.log(`[RulesModule] validateJoin: ${memberId} in ${allianceId}`);
    // Tutaj możesz dodać dodatkowe walidacje własnych zasad
  }

  static validateLeaderChange(allianceId: string, memberId: string) {
    console.log(`[RulesModule] validateLeaderChange: ${memberId} in ${allianceId}`);
    // Dodatkowe zasady np. minimalny staż w sojuszu itp.
  }
}