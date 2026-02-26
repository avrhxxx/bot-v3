
// src/AllianceServices.ts
export class AllianceService {
  static addMember(allianceId: string, memberId: string) {
    console.log(`[AllianceService] addMember: ${memberId} to ${allianceId}`);
  }

  static removeMember(allianceId: string, memberId: string) {
    console.log(`[AllianceService] removeMember: ${memberId} from ${allianceId}`);
  }

  // tu możesz dodać więcej metod później
}