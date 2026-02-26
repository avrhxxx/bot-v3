// src/AllianceService.ts
export class AllianceService {
  static addMember(allianceId: string, memberId: string) {
    console.log(`[AllianceService] addMember: ${memberId} to ${allianceId}`);
  }

  static getAlliance(allianceId: string) {
    return { id: allianceId, members: [] };
  }

  // inne stuby potrzebne dla pozostałych modułów
}